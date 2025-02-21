import Features from "@repo/controller/src/features";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { question, pdfLink } = req.body;
    if (!pdfLink) {
      return res.status(400).json({ error: "Missing pdf Link" });
    } else if (!question) {
      return res.status(400).json({ error: "Mussing question" });
    }

    const questionResponse = await Features.generateQuestionResponse(
      pdfLink,
      question,
    );
    res.status(200).json({ questionResponse });
  } catch (error) {
    console.error("Error generating question response:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
