import React, { createContext, useContext, useState, ReactNode } from 'react';

type responseType = "summary" | "question-response"
type responseStatus = "displayed" | "fetching" // add fetched state later
export type llmResponse = {id:string,type:responseType, question?:string, response?:string, status:responseStatus}

interface ChatPromptType {
    chatHistory: llmResponse[];
    addSummaryPrompt: (id: string) => void;
    updateSummaryPrompt: (id: string, response: string) => void;
    addQuestionPrompt: (id: string, question: string) => void;
    updateQuestionPrompt: (id: string, response: string) => void;
    removePrompt: (id: string) => void;
}

export const ChatContext = createContext<ChatPromptType | undefined>(undefined);

export const ChantHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [chatHistory, setChatHistory] = useState<llmResponse[]>([]);


    const removePrompt = (id:string) => {
        setChatHistory(chatHistory.filter(prompt=>prompt.id !== id))
    }

    const addSummaryPrompt = (id: string) => {
        setChatHistory([...chatHistory, { id: id, type: "summary", status: "fetching" }]);
    };

    const updateSummaryPrompt = (id: string, response: string) => {
        setChatHistory(chatHistory.map(prompt => 
            prompt.id === id ? { ...prompt, status: "displayed", response: response } : prompt
        ));
    };

    const addQuestionPrompt = (id:string,question:string) => {  
        setChatHistory([...chatHistory, {id:id,question:question,type:"question-response",status:"fetching"}])
    }   

    const updateQuestionPrompt = (id:string,response:string) => {
        setChatHistory(chatHistory.map(prompt => 
            prompt.id === id ?  { ...prompt, status: "displayed", response: response } : prompt
        ))
    }
    
    const value = {
        chatHistory,
        addSummaryPrompt,
        updateSummaryPrompt,
        addQuestionPrompt,
        updateQuestionPrompt,
        removePrompt
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChantHistoryProvider");
    }
    return context;
};