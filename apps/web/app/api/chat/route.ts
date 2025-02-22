import { geminiModel } from '@repo/model/src/config';
import { streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
    console.log("called")
  const { messages } = await req.json();

  const result = streamText({
    system:
      'You are a helpful assistant. Respond to the user in Markdown format.',
    model: geminiModel('gemini-2.0-flash-exp'),
    messages,
  });

  return result.toDataStreamResponse();
}