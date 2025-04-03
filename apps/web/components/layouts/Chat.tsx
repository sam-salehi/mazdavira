"use client";

import { useEffect, useRef, useState } from "react";
import { useChatContext } from "@/app/src/ChatContext";
import { Textarea } from "../ui/textarea";
import MarkdownDisplay from "../display/MarkdownDisplay";
import { Button } from "../ui/button";

export default function ChatLayout() {
  const { chatHistory } = useChatContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // scrolls to bottom of screen when something new is added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="relative flex flex-col w-full h-[95%] mx-auto stretch rounded-lg">
      <div
        className="space-y-4 rounded-lg mb-2 h-[88%] px-2 pt-4 bg-white overflow-y-scroll overflow-x-hidden hide-scrollbar"
        style={{ paddingBottom: "75%" }}
        ref={chatContainerRef}
      >
        {chatHistory.map((message) => (
          <div key={message.id}>
            <div className="font-bold mb-2">
              {message.role === "user" ? "You" : "Assistant"}
            </div>
            <div className="prose space-y-2">
              <MarkdownDisplay
                key={message.id}
                id={message.id}
                status={message.status}
                text={message.text}
              />
            </div>
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
}

const MessageInput = () => {
  const [input, setInput] = useState<string>("");

  const { generateResponse } = useChatContext();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = () => {
    // used to make text input get taller to keep text in view
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 5}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit()
    }
  };

  const handleSubmit = () => {
    if (input) {
      generateResponse(input)
      setInput("")
    }
  }

  useEffect(() => {
    handleResize();
  }, [input]);

  return (
    <div className="absolute bottom-5 w-full mt-10">
      <Textarea
        ref={textareaRef}
        className="w-full bg-white p-2 rounded shadow-xl resize-none h-auto"
        placeholder="Ask Anything ..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <Button className="absolute h-6 right-2 bottom-2 bg-black text-white z-10" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  );
};
