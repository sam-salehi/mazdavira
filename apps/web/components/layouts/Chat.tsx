'use client';

import { useChat } from '@ai-sdk/react';
import { MemoizedMarkdown } from '../display/MarkdownDisplay';
import { Textarea } from '../ui/textarea';
import { useEffect, useRef } from 'react';

export default function ChatLayout() {
  const { messages } = useChat({
    id: 'chat',
  });

  return (
    <div className="relative flex flex-col w-full h-[95%] mx-auto stretch rounded-lg">
      <div className="space-y-4 rounded-lg mb-2 h-[88%] px-2 pt-4 bg-white overflow-scroll hide-scrollbar">
        {messages.map(message => (
          <div key={message.id}>
            <div className="font-bold mb-2">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="prose space-y-2">
              <MemoizedMarkdown id={message.id} content={message.content} />
            </div>
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
}

const MessageInput = () => {
  const { input, handleSubmit, handleInputChange } = useChat({api:"/api/chat" , id: 'chat',       body: {
    type: "chat",
  }, },);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight+5}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    handleResize();
  }, [input]);

  return (
    <form>
      <Textarea
        ref={textareaRef}
        className="w-[95%] bg-white absolute bottom-6 p-2 rounded shadow-xl resize-none"
        placeholder="Say something..."
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        rows={1}
        style={{ height: 'auto' }}
      />
    </form>
  );
};