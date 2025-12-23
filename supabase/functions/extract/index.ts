import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractionRequest {
  content: string;
  extractionType: "task" | "decision" | "document" | "auto";
}

const extractionTools = {
  task: {
    type: "function",
    function: {
      name: "create_task",
      description: "Extract a task from the conversation content",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short, actionable task title" },
          description: { type: "string", description: "Detailed description of what needs to be done" },
          next_action: { type: "string", description: "The immediate next step to take" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority level" },
        },
        required: ["title", "priority"],
        additionalProperties: false,
      },
    },
  },
  decision: {
    type: "function",
    function: {
      name: "create_decision",
      description: "Extract a decision from the conversation content",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title summarizing the decision" },
          decision: { type: "string", description: "The actual decision that was made" },
          rationale: { type: "string", description: "Why this decision was made" },
          impact: { type: "string", enum: ["low", "medium", "high"], description: "Impact level of this decision" },
        },
        required: ["title", "decision", "impact"],
        additionalProperties: false,
      },
    },
  },
  document: {
    type: "function",
    function: {
      name: "create_document",
      description: "Extract content suitable for a document",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Document title" },
          content: { type: "string", description: "The document content in markdown format" },
          is_pinned: { type: "boolean", description: "Whether this is important enough to pin" },
        },
        required: ["title", "content"],
        additionalProperties: false,
      },
    },
  },
  auto: {
    type: "function",
    function: {
      name: "extract_items",
      description: "Analyze content and extract any tasks, decisions, or documents",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                next_action: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["title", "priority"],
            },
          },
          decisions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                decision: { type: "string" },
                rationale: { type: "string" },
                impact: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["title", "decision", "impact"],
            },
          },
          documents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                is_pinned: { type: "boolean" },
              },
              required: ["title", "content"],
            },
          },
        },
        required: ["tasks", "decisions", "documents"],
        additionalProperties: false,
      },
    },
  },
};

const systemPrompts: Record<string, string> = {
  task: `You are an expert at extracting actionable tasks from conversations. 
Analyze the content and extract a clear, actionable task.
Focus on what needs to be done, by when, and its priority.
If the content doesn't contain a clear task, extract the most actionable item you can find.`,
  
  decision: `You are an expert at identifying decisions from conversations.
Analyze the content and extract any decision that was made or proposed.
Include the reasoning behind the decision and assess its impact level.
If multiple decisions exist, extract the most significant one.`,
  
  document: `You are an expert at creating documentation from conversations.
Analyze the content and create a well-structured document.
Format the content in clean markdown with appropriate headers and sections.
Preserve important details while organizing them logically.`,
  
  auto: `You are an expert at analyzing conversations and extracting structured information.
Analyze the content and identify:
- Tasks: Actionable items that need to be done
- Decisions: Choices or determinations that were made
- Documents: Information worth preserving as documentation

Extract all relevant items. If a category has no items, return an empty array.
Be thorough but don't create items where none exist.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, extractionType }: ExtractionRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!content || !extractionType) {
      throw new Error("Content and extractionType are required");
    }

    console.log(`Extracting ${extractionType} from content (${content.length} chars)`);

    const tool = extractionTools[extractionType];
    const systemPrompt = systemPrompts[extractionType];
    const toolName = extractionType === "auto" ? "extract_items" : `create_${extractionType}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract from this content:\n\n${content}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: toolName } },
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
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No extraction result from AI");
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    console.log("Extracted data:", JSON.stringify(extracted, null, 2));

    return new Response(JSON.stringify({ 
      type: extractionType,
      data: extracted 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
