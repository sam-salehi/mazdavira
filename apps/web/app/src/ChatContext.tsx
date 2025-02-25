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

export type ChatItem = llmResponse | userQuery

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
    // setChatHistory(chatHistory.filter((prompt) => prompt.id !== id)); //FIXME: uncommet after debugging
  };



  const addBasicPrompt = (id:string,prompt:string):userQuery => {
    const query: userQuery = {id:id,role:"user",queryType:"basic",prompt}
    setChatHistory([
      ...chatHistory,
      query
    ])
    return query
  }

  const addSummaryPrompt = (id: string) => {
    const query: userQuery = { id: id,role:"user", queryType: "summary", prompt:"//FIXME:  generate a small string resembling prompt"}
    setChatHistory([
      ...chatHistory,
      query 
    ]);
    return query
  };
  

  const addQuestionPrompt = (id: string, question: string) => {
    const query:userQuery = {
      id: id,
      role:"user",
      queryType:"question",
      prompt: question,
    }
    setChatHistory([
      ...chatHistory,
      query
    ]);
    return query
  };

  const addLLMResponse = (id:string,query:userQuery,response:string) => {
    // added when response is fully fetched. before this, need to laod text as is being generated
    setChatHistory([
      ...chatHistory,
      query,
      {
        id:id,
        role:"bot",
        response: response,
        status: "displayed"
      }
    ])
  }


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
      const history: HistoryMessage[] = generateHistory(10); 
      const query: userQuery = addBasicPrompt(id,prompt)  
      const queryMessage  = convertToHistoryMessage(query)
      if (queryMessage) history.push(queryMessage);



      const response = await fetch("api/generateBasicResponse", {
        method:"POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({history}),
      })
      if (!response.ok) throw new Error("Failed to generate response")
        const {result} = await response.json();
      console.log("Post response", result)
      addLLMResponse(nanoid(),query,result)
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
      const query = addSummaryPrompt(id);
      const response = await fetch("/api/generateSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfLink }),
      });
      if (!response.ok) throw new Error("Failed to generate summary");
      const { result } = await response.json();
      addLLMResponse(nanoid(),query,result)
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
      const query = addQuestionPrompt(id, question);
      const response = await fetch("/api/generateQuestionResponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfLink, question }),
      });
      if (!response.ok) throw new Error("Error");
      const { result } = await response.json();
      addLLMResponse(nanoid(),query,result)
    } catch {
      removePrompt(id);
    }
  };

  const value = {
    chatHistory,
    generateSummary,
    generateQuestionResponse,
    generateResponse
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatHistoryProvider");
  }
  return context;
};
