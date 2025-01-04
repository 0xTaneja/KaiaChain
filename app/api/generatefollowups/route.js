import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiobj = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = geminiobj.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request) {
  const { lastBotMessage } = await request.json();

  try {
    const prompt = `
You are a helpful assistant that suggests precise follow-up questions based on the previous bot message. The user interacts with a system that supports the following actions related to the Solana blockchain and cryptocurrency:

1) Checking the balance of a wallet on a specific network (mainnet, testnet).
2) Retrieving the last few transactions from a wallet.
3) Sending KAIA to another wallet on a specific network (mainnet, testnet).
4) Checking the current price of a specific cryptocurrency.
Given the bot's last response, generate 2-3 follow-up questions or actions that the user might ask or perform next, ensuring they are relevant to the actions listed above.

Bot's last response: "${lastBotMessage}"

Your task is to generate only the follow-up questions or actions. Avoid any suffix, prefix, numbering, or additional text. The follow-up messages should be explicit and specific. For instance:

- "What's the current price of KAIA?"
- "Check my KAIA balance on testnet."
- "Send 0.2 KAIA to C1Q85yjUtPQookfxbAFzJo9whF7nnN5RqduDFviZ9FVZ on testnet."
`;

    const aiResponse = await model.generateContent(prompt);
    const followUpMessages = aiResponse.response
      .text()
      .split("\n")
      .filter((line) => line.trim().length > 0);

    return NextResponse.json({ followUpMessages });
  } catch (error) {
    console.error("Error generating follow-ups:", error);
    return NextResponse.json(
      { error: "Failed to generate follow-up messages." },
      { status: 500 }
    );
  }
}
