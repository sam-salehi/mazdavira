import { nanoid } from "nanoid";

import { Button } from "@/components/ui/button";

import PaperCard from "../display/PaperCardDisplay";
import { useChatContext } from "@/app/src/ChatContext";
import { chosenPaper } from "@/app/page";
import { removeRequestMeta } from "next/dist/server/request-meta";

// Features.generateSummary("ww.google.com")

export function Sidebar({
  selectedPaper,
  onSelectPaper,
  onClose,
  chosenPapers,
  setChosenPapers,
}: {
  selectedPaper: string;
  onSelectPaper: (s: string) => void;
  onClose: () => void;
  chosenPapers: chosenPaper[];
  setChosenPapers: (papers: chosenPaper[]) => void;
}) {
  // Sidebar is to be used for conversing with the llm and operating on the graph.

  const {
    addSummaryPrompt,
    updateSummaryPrompt,
    addQuestionPrompt,
    updateQuestionPrompt,
    removePrompt,
  } = useChatContext();

  const generateSummary = async function (
    arxiv: string,
    pdfLink: string,
    callback: () => void,
    errorCallback: () => void,
  ) {
    //FIXME: move api requests? use contex?
    const id: string = nanoid(); // unique identifier for array
    try {
      addSummaryPrompt(id);
      const response = await fetch("/api/generateSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfLink }),
      });
      if (!response.ok) throw new Error("Failed to generate summary");
      const { summary } = await response.json();
      const adaptPaper = (paper: chosenPaper) =>
        paper.arxiv === arxiv ? { ...paper, summary } : paper;

      setChosenPapers(chosenPapers.map(adaptPaper));
      updateSummaryPrompt(id, summary);
      callback();
    } catch {
      removePrompt(id);
      errorCallback();
    }
  };

  const generateQuestionResponse = async function (
    pdfLink: string,
    question: string,
  ) {
    console.log("Generating response");
    const id: string = nanoid();
    try {
      addQuestionPrompt(id, question);
      const response = await fetch("/api/generateQuestionResponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfLink, question }),
      });
      if (!response.ok) throw new Error("Error"); //FIXME: display actual error instead
      const { questionResponse } = await response.json();

      updateQuestionPrompt(id, questionResponse);
    } catch {
      removePrompt(id);
    }
  };

  return (
    <div className="bg-black fixed border-l border-gray-500 right-0 top-0 h-full w-1/4 p-7">
      <div className="flex justify-between">
        <Button variant={"secondary"} onClick={onClose}>
          Close
        </Button>
        <Button variant={"secondary"}>Chat</Button>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4">
        {chosenPapers.map((paper) => (
          <PaperCard
            key={paper.arxiv}
            id={paper.arxiv}
            title={paper.title}
            authors={paper.authors}
            summary={paper.summary}
            year={paper.year}
            link={paper.link}
            selected={selectedPaper === paper.arxiv}
            onSummaryGeneration={generateSummary}
            onQuestionResponseGeneration={generateQuestionResponse}
            onClick={() => onSelectPaper(paper.arxiv)}
            onClose={() =>
              setChosenPapers(
                chosenPapers.length > 1
                  ? chosenPapers.filter((p) => p.arxiv !== paper.arxiv)
                  : [],
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
