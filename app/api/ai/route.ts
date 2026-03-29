import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    let prompt = "";

    if (action === "extract") {
      prompt = `You are a task management assistant. Extract a list of distinct tasks from the user's input below.
Return ONLY a valid JSON object with a key "tasks" containing an array of strings. Do not include markdown formatting.
Example: { "tasks": ["Buy milk", "Email John about the project report"] }

User Input:
${payload.text}`;

    } else if (action === "classify") {
      prompt = `You are an Eisenhower Matrix classification assistant. Given a list of tasks, classify each one into one of four quadrants:
- q1: Do First (Urgent & Important)
- q2: Schedule (Not Urgent & Important)
- q3: Delegate (Urgent & Not Important)
- q4: Eliminate (Not Urgent & Not Important)

Analyze the task text carefully. If it mentions deadlines, VIPs, or emergencies, it's likely urgent. If it impacts long-term goals or core responsibilities, it's important.

Return ONLY a valid JSON object with a key "tasks" containing an array of objects with 'id' and 'quadrant'. Do not include markdown formatting.
Example: { "tasks": [{"id": "123", "quadrant": "q1"}, {"id": "456", "quadrant": "q3"}] }

Tasks to Classify:
${JSON.stringify(payload.tasks)}`;

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const response = await fetch(modelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      let errMsg = "Unknown Gemini error";
      try {
        const parsedErr = JSON.parse(err);
        errMsg = parsedErr.error?.message || err;
      } catch {
        // Ignore parse error
      }
      throw new Error(`Gemini error: ${errMsg}`);
    }

    const data = await response.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    // Sometimes older models wrap JSON in markdown block even if told not to.
    content = content.replace(/^```json/i, '').replace(/```$/i, '').trim();

    if (!content) {
      throw new Error("Empty response from AI");
    }
    
    // Parse the JSON
    try {
      const parsed = JSON.parse(content);
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
         throw new Error("Missing 'tasks' array in response");
      }
      return NextResponse.json({ result: parsed.tasks });
    } catch {
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
