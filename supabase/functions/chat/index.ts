import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  mode: string;
  context: {
    tasks?: Array<{ title: string; status: string; priority: string; description?: string }>;
    decisions?: Array<{ title: string; decision: string; status: string; impact: string }>;
    documents?: Array<{ title: string; content: string }>;
  };
}

const getModeSystemPrompt = (mode: string): string => {
  const baseContext = `You are a helpful AI assistant for a project management and development tool. You have access to the project's tasks, decisions, and documents to provide contextual assistance.`;
  
  const modePrompts: Record<string, string> = {
    design: `${baseContext}

You are in DESIGN mode. Focus on:
- Helping with UI/UX design decisions
- Suggesting visual improvements and user experience enhancements
- Discussing color schemes, layouts, and component design
- Reviewing design patterns and best practices
- Creating wireframes or design specifications in text form`,
    
    debug: `${baseContext}

You are in DEBUG mode. Focus on:
- Analyzing error messages and stack traces
- Identifying potential bugs and issues
- Suggesting debugging strategies and approaches
- Explaining error causes and solutions
- Helping trace issues through code logic`,
    
    planning: `${baseContext}

You are in PLANNING mode. Focus on:
- Breaking down features into actionable tasks
- Estimating effort and complexity
- Identifying dependencies and blockers
- Suggesting project structure and organization
- Creating roadmaps and milestones`,
    
    implementation: `${baseContext}

You are in IMPLEMENTATION mode. Focus on:
- Writing clean, maintainable code
- Suggesting implementation approaches
- Reviewing code patterns and best practices
- Helping with specific coding challenges
- Providing code examples and snippets`,
    
    review: `${baseContext}

You are in REVIEW mode. Focus on:
- Reviewing decisions and their rationale
- Analyzing completed work
- Suggesting improvements and optimizations
- Identifying potential issues or risks
- Documenting lessons learned`,
  };
  
  return modePrompts[mode] || baseContext;
};

const buildContextMessage = (context: ChatRequest['context']): string => {
  const parts: string[] = [];
  
  if (context.tasks && context.tasks.length > 0) {
    parts.push("## Current Tasks\n" + context.tasks.map(t => 
      `- **${t.title}** [${t.status}] (${t.priority} priority)${t.description ? `: ${t.description}` : ''}`
    ).join('\n'));
  }
  
  if (context.decisions && context.decisions.length > 0) {
    parts.push("## Key Decisions\n" + context.decisions.map(d => 
      `- **${d.title}** [${d.status}]: ${d.decision} (${d.impact} impact)`
    ).join('\n'));
  }
  
  if (context.documents && context.documents.length > 0) {
    parts.push("## Relevant Documents\n" + context.documents.map(d => 
      `### ${d.title}\n${d.content.substring(0, 500)}${d.content.length > 500 ? '...' : ''}`
    ).join('\n\n'));
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  return `\n\n---\n# Project Context\n\n${parts.join('\n\n')}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, context }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getModeSystemPrompt(mode);
    const contextMessage = buildContextMessage(context);
    
    const fullSystemPrompt = systemPrompt + contextMessage;

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
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
