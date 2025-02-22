import Features from "@repo/controller/src/features";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  console.log("request recieved")
  try {
    const { pdfLink } = req.body;
    if (!pdfLink) {
      return res.status(400).json({ error: "Missing pdfLink" });
    }
    const result = await Features.generateSummary(pdfLink);
    res.status(200).send(result.toDataStreamResponse());
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
