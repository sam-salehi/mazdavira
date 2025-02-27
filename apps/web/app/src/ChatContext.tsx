import React, { createContext, useContext, useState, ReactNode } from "react";
import { nanoid } from "nanoid";
import type { CoreAssistantMessage, CoreUserMessage } from "ai";

// TODO: make react state that gets toggled when prompt gets sent 
//       and when prompt recieves an answer. (figure out how to stream responses)
type QueryType = "summary" | "question" | "basic";
export type responseStatus = "displayed" |  "displaying" | "generating"; // removed "fetching"
export type RoleType = "user" | "assistant"
type HistoryMessage = CoreAssistantMessage | CoreUserMessage

export type userQuery = {
  id:string,
  role:"user"
  text: string 
  queryType: QueryType,
  status: "displayed"
}

export type llmResponse = {
  id: string;
  role: "assistant";
  text: string;
  status: responseStatus;
};

export type ChatItem = llmResponse | userQuery

interface ChatPromptType {
  chatHistory: ChatItem[];
  generateSummary: (arxiv:string,pdfLink:string)=>void     
  generateQuestionResponse: (pdfLink:string,question:string)=>void,
  generateResponse: (prompt:string) => void,
  setResponseToDisplayed: (id:string) =>void
}

const ChatContext = createContext<ChatPromptType | undefined>(undefined);

export const ChantHistoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);

  const removePrompt = (id: string) => {
    setChatHistory(chatHistory.filter((prompt) => prompt.id !== id)); 
  };

  const removeFetchingPrompts = () => {
    // removes prompts to model that are to be overrun by another request.
    // removes type = "generating"
    // setChatHistory((chatHistory) => chatHistory.filter((item) => item.role !== "assistant" || item.status !== "generating"));
  }

  const addBasicPrompt = (id:string,prompt:string):userQuery => {
    const query: userQuery = {id:id,role:"user",status:"displayed",queryType:"basic",text:prompt}
    setChatHistory([
      ...chatHistory,
      query
    ])
    return query
  }

  const addSummaryPrompt = (id: string,title:string) => { 

    setChatHistory((prevChatHistory) => [
      ...prevChatHistory,
      { id: id,role:"user",status:"displayed",queryType: "summary", text:`Could you summarize "${title}".`}
    ]);
  };

  const addQuestionPrompt = (id: string, question: string) => {
    setChatHistory((prevChatHistory)=>[
      ...prevChatHistory,
      {
        id: id,
        role:"user",
        status:"displayed",
        queryType:"question",
        text: question,
      }
    ]);
  };

  const addGeneratingLLMResponse = (id:string) => {
    setChatHistory(prevChatHistory => [
      ...prevChatHistory,
      {
        id:id,
        role:"assistant",
        text: "",
        status: "generating"
      }
    ])
  }

  const addLLMResponse = (id:string,response:string) => { 
    // if a response container was created using addGeneratingLLMResponse:
    // adds llm response to that
    setChatHistory(prevChatHistory => prevChatHistory.map(chat => {
        if (chat.id === id && chat.role==="assistant") {
          return { ...chat, text: response, status: "displaying" };
        }
        return chat;
      })
    )
  }

  const setResponseToDisplayed = (id: string) => {
    // called after front end has rendered the entire string onto screen
    setChatHistory(prevChatHistory => 
        prevChatHistory.map(chat => 
            chat.id === id ? { ...chat, status: "displayed" } : chat
        )
    );
  };

  const convertToHistoryMessage = function(conv: ChatItem): HistoryMessage | null {
    // takes a ChatItem and turns into proper format to be fed into model as history
    // if (conv.role === "user") return {role: "user", content:conv.text}
    // if (conv.role === "bot") return {role:"assistant",content:conv.text}
    return {role:conv.role, content:conv.text}
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
    const promptID: string = nanoid();
    const responseID: string = nanoid();
    try {
      removeFetchingPrompts();
      const history: HistoryMessage[] = generateHistory(10); 
      const query: userQuery = addBasicPrompt(promptID,prompt)  
      const queryMessage  = convertToHistoryMessage(query)
      if (queryMessage) history.push(queryMessage);
      addGeneratingLLMResponse(responseID)
      const response = await fetch("api/generateBasicResponse", {
        method:"POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({history}),
      })
      if (!response.ok) throw new Error("Failed to generate response")
      const {result} = await response.json();
      addLLMResponse(responseID,result) 
    } catch {
      removePrompt(promptID)
    }
  }

  const generateSummary = async function (
    title: string,
    pdfLink: string,
  ) {
    const promptID: string = nanoid(); 
    const responseID: string = nanoid();
    try {
      removeFetchingPrompts();
      addSummaryPrompt(promptID,title);
      addGeneratingLLMResponse(responseID)
      const response = await fetch("/api/generateSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfLink }),
      });
      if (!response.ok) throw new Error("Failed to generate summary");
      const { result } = await response.json();
      addLLMResponse(responseID,result)
    } catch {
      removePrompt(promptID);
    }
  };


  const generateQuestionResponse = async function (
    pdfLink: string,
    question: string,
  ) {
    const promptID: string = nanoid();
    const responseID: string = nanoid();
    try {
      removeFetchingPrompts();
      addQuestionPrompt(promptID, question);
      addGeneratingLLMResponse(responseID)
      const response = await fetch("/api/generateQuestionResponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfLink, question }),
      });
      if (!response.ok) throw new Error("Error");
      const { result } = await response.json();
      addLLMResponse(responseID,result)
    } catch {
      removePrompt(promptID);
    }
  };

  const value = {
    chatHistory,
    generateSummary,
    generateQuestionResponse,
    generateResponse,
    setResponseToDisplayed
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
