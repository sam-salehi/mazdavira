import React, { createContext, useContext, useState, ReactNode } from "react";
import { nanoid } from "nanoid";
import type { CoreAssistantMessage, CoreUserMessage } from "ai";

// TODO: make react state that gets toggled when prompt gets sent 
//       and when prompt recieves an answer. (figure out how to stream responses)
// TODO: 
type QueryType = "summary" | "question" | "basic";
type responseStatus = "displayed" |  "displaying"; // removed "fetching"
type HistoryMessage = CoreAssistantMessage | CoreUserMessage



export type userQuery = {
  id:string,
  role:"user"
  queryType: QueryType
  prompt: string 
}

export type llmResponse = {
  id: string;
  role: "bot";
  response?: string;
  status: responseStatus;
};

type ChatItem = llmResponse | userQuery

interface ChatPromptType {
  chatHistory: ChatItem[];
  generateSummary: (arxiv:string,pdfLink:string)=>void     
  generateQuestionResponse: (pdfLink:string,question:string)=>void,
  generateResponse: (prompt:string) => void,
}

const ChatContext = createContext<ChatPromptType | undefined>(undefined);

export const ChantHistoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);

  const removePrompt = (id: string) => {
    setChatHistory(chatHistory.filter((prompt) => prompt.id !== id));
  };



  const addBasicPrompt = (id:string,prompt:string) => {
    setChatHistory([
      ...chatHistory,
      {id:id,role:"user",queryType:"basic",prompt}
    ])
  }

  const addSummaryPrompt = (id: string) => {
    setChatHistory([
      ...chatHistory,
      { id: id,role:"user", queryType: "summary", prompt:"//FIXME:  generate a small string resembling prompt"},
    ]);
  };
  

  const addQuestionPrompt = (id: string, question: string) => {
    setChatHistory([
      ...chatHistory,
      {
        id: id,
        role:"user",
        queryType:"question",
        prompt: question,
      },
    ]);
  };

  const addLLMResponse = (id:string,response:string) => {
    // added when response is fully fetched. before this, need to laod text as is being generated
    setChatHistory([
      ...chatHistory,
      {
        id:id,
        role:"bot",
        response: response,
        status: "displayed"
      }
    ])
  }

  // const updatePrompt = (id: string, response: string) => { //FIXME: delete this
  //   // used to set any type of sent prompt to displaying to begin
  //   // loading the message onto the screen
  //   setChatHistory([...chatHistory,{
  //     id: id, type:"question-response" ,role:"bot", status:"displaying", response:response 
  //   }])
  //   // setChatHistory(
  //   //   chatHistory.map((prompt) =>
  //   //     prompt.id === id
  //   //       ? { ...prompt, status: "displaying", response: response }
  //   //       : prompt,
  //   //   ),
  //   // );
  // };

  

  const convertToHistoryMessage = function(conv: ChatItem): HistoryMessage | null {
    // takes a ChatItem and turns into proper format to be fed into model as history
    if (conv.role === "user") return {role: "user", content:conv.prompt}
    if (conv.role === "bot" && conv.response) return {role:"assistant",content:conv.response}
    return null
  }

  const generateHistory = function(count:number): HistoryMessage[] {
    // takes last count of previous conversations to pass to the model as history
    const includedMessages = chatHistory.slice(-count)
    const result: HistoryMessage[] = []
    includedMessages.forEach((conv:ChatItem) => {
      const message = convertToHistoryMessage(conv)
      if (message) result.push(message)
    })
    return result
  }



  const generateResponse = async function (prompt:string) {
    // generates a response to normal prompt send to model
    // includes history of previous conversations with prompt.
    const id: string = nanoid();
    try {
      const history: HistoryMessage[] = generateHistory(5);
      addBasicPrompt(id,prompt)
      const response = await fetch("api/generateBasicResponse", {
        method:"POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({prompt,history}),
      })
      if (!response.ok) throw new Error("Failed to generate response")
        const {result} = await response.json();
      console.log("Post response", result)
    } catch {
      removePrompt(id)
    }
  }

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
      const { result } = await response.json();
      console.log("Post response", result);
      addLLMResponse(id,result)
    //   setChosenPapers(chosenPapers.map(adaptPaper));
    } catch {
      removePrompt(id);
    }
  };


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
      if (!response.ok) throw new Error("Error");
      const { result } = await response.json();
      addLLMResponse(id,result)
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
    generateQuestionResponse,
    generateResponse
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChantHistoryProvider");
  }
  return context;
};
