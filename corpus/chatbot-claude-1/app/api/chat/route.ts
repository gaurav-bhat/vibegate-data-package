import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const messages: ChatMessage[] | undefined = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Request body must include a non-empty `messages` array." },
      { status: 400 }
    );
  }

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    return NextResponse.json(
      { error: `OpenAI API error: ${errText}` },
      { status: openaiRes.status }
    );
  }

  const data = await openaiRes.json();
  const reply: string = data.choices?.[0]?.message?.content ?? "";

  return NextResponse.json({ reply });
}
