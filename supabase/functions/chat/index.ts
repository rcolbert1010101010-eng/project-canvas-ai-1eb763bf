import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StructuredContext {
  pinnedDocuments: Array<{ title: string; content: string }>;
  acceptedDecisions: Array<{ title: string; decision: string; impact: string; rationale?: string }>;
  activeTasks: Array<{ title: string; status: string; priority: string; description?: string; next_action?: string }>;
  blockedTasks: Array<{ title: string; status: string; priority: string; blocked_reason?: string }>;
  conversationSummary: string | null;
  conversationPurpose: string | null;
  recentMessages: Array<{ role: string; content: string }>;
  includeRecentMessages: boolean;
  mode: string;
}

interface ChatRequest {
  userMessage: string;
  context: StructuredContext;
}

const getModeSystemPrompt = (mode: string): string => {
  const baseContext = `You are a helpful AI assistant for a project management and development tool. You help users with their projects using structured memory - not chat history.`;
  
  const modePrompts: Record<string, string> = {
    design: `${baseContext}

You are in DESIGN mode. Focus on:
- Helping with UI/UX design decisions
- Suggesting visual improvements and user experience enhancements
- Discussing color schemes, layouts, and component design
- Reviewing design patterns and best practices
- Creating wireframes or design specifications in text form

Use the pinned documents and accepted decisions as your primary context.`,
    
    debug: `${baseContext}

You are in DEBUG mode. Focus on:
- Analyzing error messages and stack traces
- Identifying potential bugs and issues
- Suggesting debugging strategies and approaches
- Explaining error causes and solutions
- Helping trace issues through code logic

Pay special attention to blocked tasks and recent conversation context.`,
    
    planning: `${baseContext}

You are in PLANNING mode. Focus on:
- Breaking down features into actionable tasks
- Estimating effort and complexity
- Identifying dependencies and blockers
- Suggesting project structure and organization
- Creating roadmaps and milestones

Use in-progress tasks and accepted decisions as your primary context.`,
    
    implementation: `${baseContext}

You are in IMPLEMENTATION mode. Focus on:
- Writing clean, maintainable code
- Suggesting implementation approaches
- Reviewing code patterns and best practices
- Helping with specific coding challenges
- Providing code examples and snippets

Use pinned documents and in-progress tasks as your primary context.`,
    
    review: `${baseContext}

You are in REVIEW mode. Focus on:
- Reviewing decisions and their rationale
- Analyzing completed work
- Suggesting improvements and optimizations
- Identifying potential issues or risks
- Documenting lessons learned

Use accepted decisions and pinned documents as your primary context.`,
  };
  
  return modePrompts[mode] || baseContext;
};

/**
 * Build structured context message with clear sections
 * Order: Project Context → Accepted Decisions → Active Tasks → Conversation Summary → Recent Messages
 */
const buildStructuredContextMessage = (context: StructuredContext): string => {
  const sections: string[] = [];
  
  // 1. Project Context (Pinned Documents) - Always first
  if (context.pinnedDocuments.length > 0) {
    const docsSection = context.pinnedDocuments.map(d => {
      const truncatedContent = d.content.length > 1000 
        ? d.content.substring(0, 1000) + '...' 
        : d.content;
      return `### ${d.title}\n${truncatedContent}`;
    }).join('\n\n');
    sections.push(`## 📄 Project Context (Pinned Documents)\n\n${docsSection}`);
  }
  
  // 2. Accepted Decisions
  if (context.acceptedDecisions.length > 0) {
    const decisionsSection = context.acceptedDecisions.map(d => {
      let entry = `- **${d.title}**: ${d.decision} _(${d.impact} impact)_`;
      if (d.rationale) {
        entry += `\n  _Rationale: ${d.rationale}_`;
      }
      return entry;
    }).join('\n');
    sections.push(`## ✅ Accepted Decisions\n\n${decisionsSection}`);
  }
  
  // 3. Active Tasks (In Progress)
  if (context.activeTasks.length > 0) {
    const tasksSection = context.activeTasks.map(t => {
      let entry = `- **${t.title}** [${t.status}] _(${t.priority} priority)_`;
      if (t.description) entry += `\n  ${t.description}`;
      if (t.next_action) entry += `\n  _Next: ${t.next_action}_`;
      return entry;
    }).join('\n');
    sections.push(`## 🔄 Active Tasks (In Progress)\n\n${tasksSection}`);
  }
  
  // 4. Blocked Tasks (if any)
  if (context.blockedTasks.length > 0) {
    const blockedSection = context.blockedTasks.map(t => {
      let entry = `- **${t.title}** [BLOCKED] _(${t.priority} priority)_`;
      if (t.blocked_reason) entry += `\n  _Blocked: ${t.blocked_reason}_`;
      return entry;
    }).join('\n');
    sections.push(`## 🚫 Blocked Tasks\n\n${blockedSection}`);
  }
  
  // 5. Conversation Summary (preferred over full history)
  if (context.conversationSummary) {
    let summarySection = context.conversationSummary;
    if (context.conversationPurpose) {
      summarySection = `**Purpose:** ${context.conversationPurpose}\n\n${summarySection}`;
    }
    sections.push(`## 📝 Conversation Summary\n\n${summarySection}`);
  } else if (context.conversationPurpose) {
    sections.push(`## 🎯 Conversation Purpose\n\n${context.conversationPurpose}`);
  }
  
  if (sections.length === 0) {
    return '';
  }
  
  return `\n\n---\n# Structured Memory Context\n\n${sections.join('\n\n---\n\n')}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, context }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[chat] Mode: ${context.mode}, Include messages: ${context.includeRecentMessages}`);
    console.log(`[chat] Context - Docs: ${context.pinnedDocuments.length}, Decisions: ${context.acceptedDecisions.length}, Tasks: ${context.activeTasks.length + context.blockedTasks.length}`);
    console.log(`[chat] Recent messages: ${context.recentMessages.length}`);

    const systemPrompt = getModeSystemPrompt(context.mode);
    const contextMessage = buildStructuredContextMessage(context);
    const fullSystemPrompt = systemPrompt + contextMessage;

    // Build messages array: only recent messages (capped) + new user message
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    
    // Add recent messages if included
    if (context.includeRecentMessages && context.recentMessages.length > 0) {
      for (const msg of context.recentMessages) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }
    
    // Add the new user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    console.log(`[chat] Total messages to AI: ${messages.length} (system prompt length: ${fullSystemPrompt.length})`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[chat] AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[chat] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
