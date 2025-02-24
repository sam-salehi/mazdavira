import React, { createContext, useContext, useState, ReactNode } from "react";
import { nanoid } from "nanoid";
import { useChat } from '@ai-sdk/react';
import { SettingsIcon } from "lucide-react";
import { config } from "dotenv";


// FIXME: figure out wether you want to keep all this mess for storage or can just use aiSDL
type responseType = "summary" | "question-response";
type responseStatus = "displayed" | "fetching"; // add fetched state later
export type llmResponse = {
  id: string;
  type: responseType;
  question?: string;
  response?: string;
  status: responseStatus;
};

interface ChatPromptType {
  chatHistory: llmResponse[];
//   addSummaryPrompt: (id: string) => void;
//   updateSummaryPrompt: (id: string, response: string) => void;
//   addQuestionPrompt: (id: string, question: string) => void;
//   updateQuestionPrompt: (id: string, response: string) => void;
//   removePrompt: (id: string) => void;
  generateSummary: (arxiv:string,pdfLink:string)=>void     
  generateQuestionResponse: (pdfLink:string,question:string)=>void
}

const ChatContext = createContext<ChatPromptType | undefined>(undefined);

export const ChantHistoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [chatHistory, setChatHistory] = useState<llmResponse[]>([]);

  const removePrompt = (id: string) => {
    setChatHistory(chatHistory.filter((prompt) => prompt.id !== id));
  };

  const addSummaryPrompt = (id: string) => {
    setChatHistory([
      ...chatHistory,
      { id: id, type: "summary", status: "fetching" },
    ]);
  };

  const updateSummaryPrompt = (id: string, response: string) => {
    setChatHistory(
      chatHistory.map((prompt) =>
        prompt.id === id
          ? { ...prompt, status: "displayed", response: response }
          : prompt,
      ),
    );
  };

  const addQuestionPrompt = (id: string, question: string) => {
    setChatHistory([
      ...chatHistory,
      {
        id: id,
        question: question,
        type: "question-response",
        status: "fetching",
      },
    ]);
  };


  //TODO: start by removing useChat hooks and adding normal chat here.

  const updateQuestionPrompt = (id: string, response: string) => {
    setChatHistory(
      chatHistory.map((prompt) =>
        prompt.id === id
          ? { ...prompt, status: "displayed", response: response }
          : prompt,
      ),
    );
  };


  const generateSummary = async function (
    arxiv: string,
    pdfLink: string,
  ) {
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
      console.log("Post response", summary);
    //   setChosenPapers(chosenPapers.map(adaptPaper));
      updateSummaryPrompt(id, summary);
    } catch {
      removePrompt(id);
    }
  };

  // const { handleSubmit,messages } = useChat({ id: 'chat' });
  // // TODO:L figure out how to make this work
  //   const generateSummary2 = async function (
  //     pdfLink: string
  //   ) {

  //     const configFunction = (userMessage: string) => {
  //       return {
  //         messages: [...messages, { content: userMessage, role: 'user' }],
  //         body: { type: 'summary', pdfLink: pdfLink }
  //       }
  //     }
  //     handleSubmit()
  //   }

  const generateQuestionResponse = async function (
    pdfLink: string,
    question: string,
  ) {
    const id: string = nanoid();
    try {
      addQuestionPrompt(id, question);
      const response = await fetch("/api/generateQuestionResponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfLink, question }),
      });
      if (!response.ok) throw new Error("Error"); // FIXME:
      const { questionResponse } = await response.json();
      console.log("Response: ", response)
      updateQuestionPrompt(id, questionResponse);
    } catch {
      removePrompt(id);
    }
  };

  const value = {
    chatHistory,
    // addSummaryPrompt,
    // updateSummaryPrompt,
    // addQuestionPrompt,
    // updateQuestionPrompt,
    // removePrompt,
    generateSummary,
    generateQuestionResponse
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChantHistoryProvider");
  }
  return context;
};
