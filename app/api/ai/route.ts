import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // Determine the base URL so users can override it for local models or Groq, etc.
    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"; // Good fast default

    let systemPrompt = "";
    let userMessage = "";

    if (action === "extract") {
      systemPrompt = `You are a task management assistant. Extract a list of distinct tasks from the user's input.
Return ONLY a valid JSON object with a key "tasks" containing an array of strings. Do not include markdown formatting.
Example: { "tasks": ["Buy milk", "Email John about the project report"] }`;
      userMessage = payload.text;
    } else if (action === "classify") {
      systemPrompt = `You are an Eisenhower Matrix classification assistant. Given a list of tasks, classify each one into one of four quadrants:
- q1: Do First (Urgent & Important)
- q2: Schedule (Not Urgent & Important)
- q3: Delegate (Urgent & Not Important)
- q4: Eliminate (Not Urgent & Not Important)

Analyze the task text carefully. If it mentions deadlines, VIPs, or emergencies, it's likely urgent. If it impacts long-term goals or core responsibilities, it's important.

Return ONLY a valid JSON object with a key "tasks" containing an array of objects with 'id' and 'quadrant'. Do not include markdown formatting.
Example: { "tasks": [{"id": "123", "quadrant": "q1"}, {"id": "456", "quadrant": "q3"}] }`;
      userMessage = JSON.stringify(payload.tasks);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const response = await fetch(baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      let errMsg = "Unknown OpenAI error";
      try {
        const parsedErr = JSON.parse(err);
        errMsg = parsedErr.error?.message || err;
      } catch (e) {}
      throw new Error(`OpenAI error: ${errMsg}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Parse the JSON
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({ result: parsed.tasks });
    } catch (e) {
      throw new Error("Failed to parse AI response as JSON or missing 'tasks' key");
    }

  } catch (error) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
