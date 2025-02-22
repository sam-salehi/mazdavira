import Features from '@repo/controller/src/features';
import { geminiModel } from '@repo/model/src/config';
import { streamText } from 'ai';

export const maxDuration = 60;


type PostType = "summary" | "chat" | "question"

type routeBody = {
  message: string,
  type:PostType,
  pdfLink?:string
}  | any

export async function POST(req: Request) {

  const resJson:routeBody = await req.json();
  const {messages, type} = resJson
  console.log(resJson)

  let result;
  if (type==="chat") {
    result = streamText({
      system:
        'You are a helpful assistant. Respond to the user in Markdown format.',
      model: geminiModel('gemini-2.0-flash-exp'),
      messages,
    });
  } else if (type === "summary") {
    result = await Features.generateSummary(resJson.pdfLink)
  }  else {
    result = await Features.generateSummary(resJson.pdfLink) //TODO: change to question answering
  }


  return result.toDataStreamResponse();
}