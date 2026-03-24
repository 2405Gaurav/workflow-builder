import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { model, systemPrompt, userMessage, images } = await req.json();

    if (!userMessage) {
      return NextResponse.json({ error: "User message is required" }, { status: 400 });
    }

    const validModel = "gemini-2.5-flash";

    // ==============================
    // ✅ 1. Trigger.dev (PRIMARY)
    // ==============================
    if (process.env.TRIGGER_SECRET_KEY) {
      try {
        const run = await tasks.trigger("execute-llm", {
          model: validModel,
          systemPrompt,
          userMessage,
          images: images || [],
        });

        let output: any = null;

        // Poll for completion (Wait up to 30s for LLM)
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const status = await runs.retrieve(run.id);

          if (status.status === "COMPLETED") {
            output = status.output;
            break;
          }
          if (status.status === "FAILED") {
            throw new Error("Trigger.dev LLM task failed");
          }
        }

        if (output?.text) {
          return NextResponse.json({ text: output.text });
        }
      } catch (err) {
        console.warn("Trigger.dev failed → falling back to direct call:", err);
      }
    }

    // ==============================
    // ✅ 2. LOCAL FALLBACK
    // ==============================
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({
      model: validModel,
      systemInstruction: systemPrompt || undefined,
    });

    const parts: any[] = [{ text: userMessage }];

    // Handle images for local fallback
    if (images && images.length > 0) {
      for (const imageUrl of images) {
        if (imageUrl.startsWith("data:")) {
          const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) parts.push({ inlineData: { data: matches[2], mimeType: matches[1] } });
        } else {
          const res = await fetch(imageUrl);
          const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
          parts.push({ inlineData: { data: b64, mimeType: res.headers.get("content-type") || "image/jpeg" } });
        }
      }
    }

    const result = await genModel.generateContent(parts);
    return NextResponse.json({ text: result.response.text() });

  } catch (error: any) {
    console.error("LLM Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}