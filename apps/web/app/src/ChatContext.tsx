import React, { createContext, useContext, useState, ReactNode } from 'react';

type responseType = "summary" | "question-response"
type responseStatus = "displayed" | "fetched" | "fetching"
export type llmResponse = {id:number,type:responseType, question?:string, response?:string, status:responseStatus}

interface ChatContextType {
    chatHistory: llmResponse[];
    setChatHistory: React.Dispatch<React.SetStateAction<llmResponse[]>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChantHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [chatHistory, setChatHistory] = useState<llmResponse[]>([]);
    const value = {
        chatHistory,
        setChatHistory,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChantHistoryProvider");
    }
    return context;
};