import { Anthropic } from '@anthropic-ai/sdk';
import { StreamingTextResponse, Message } from 'ai';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: messages.map((m: Message) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
    stream: true,
  });

  return new StreamingTextResponse(response.toReadableStream());
} 