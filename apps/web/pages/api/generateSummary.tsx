import { NextApiRequest, NextApiResponse } from "next";
import Features from "@repo/controller/src/features";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  console.log("request recieved");
  try {
    const { pdfLink } = req.body;
    if (!pdfLink) {
      return res.status(400).json({ error: "Missing pdfLink" });
    }
    const result = await Features.generateSummary(pdfLink);
    console.log("Returning Result", result);
    res.status(200).json({ result });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
