import { NextApiRequest, NextApiResponse } from "next";
import Features from "@repo/controller/src/features";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { history } = req.body;

    if (!history) {
      return res.status(400).json({ error: "Missing history" });
    }

    const result = await Features.generateBasicResponse(history);

    console.log("Generated response");
    console.log(result);
    res.status(200).json({ result });
  } catch (error) {
    console.error("Error generating basic response:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
