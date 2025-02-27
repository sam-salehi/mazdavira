import Features from "@repo/controller/src/features";
import { geminiModel } from "@repo/model/src/config";
import { streamText } from "ai";

export const maxDuration = 60;

type PostType = "summary" | "chat" | "question";

type routeBody =
  | {
      message: string;
      type: PostType;
      pdfLink?: string;
    }
  | any;

// POST at api/chat path is called through useChat hook
export async function POST(req: Request) {
  console.log("Called ");
  const resJson: routeBody = await req.json();
  const { messages, type } = resJson;
  console.log(resJson);

  let result;
  if (type === "chat") {
    result = streamText({
      system:
        "You are a helpful assistant. Respond to the user in Markdown format.",
      model: geminiModel("gemini-2.0-flash-exp"),
      messages,
    });
  } else if (type === "summary") {
    console.log("summarizing");
    console.log(resJson.pdfLink);
    result = await Features.generateSummary(resJson.pdfLink);
  } else {
    result = await Features.generateQuestionResponse(
      resJson.pdfLink,
      resJson.question,
    ); //TODO: change to question answering
  }

  return result.toDataStreamResponse();
}
