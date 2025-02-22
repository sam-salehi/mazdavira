'use client';

import { useChat } from '@ai-sdk/react';
import { MemoizedMarkdown } from '../display/MarkdownDisplay';
import { Textarea } from '../ui/textarea';
import { useEffect, useRef } from 'react';

export default function ChatLayout() {
  const { messages } = useChat({
    id: 'chat',
    experimental_throttle: 10,
  });

  return (
    <div className="relative flex flex-col w-full h-[95%] mb-2 pt-4 px-2 mx-auto stretch bg-white rounded-lg">
      <div className="space-y-4 mb-2 overflow-scroll hide-scrollbar">
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
  const { input, handleSubmit, handleInputChange } = useChat({ id: 'chat' });
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
      
      // Create the body object
      const body = { type: "chat", messages: [{ role: 'user', content: input }] }; // Include messages

      handleSubmit({},{
          body: {
            type: "chat",
          },
      }); // Pass the body object to handleSubmit
    }
  };

  useEffect(() => {
    handleResize();
  }, [input]);

  return (
    <form>
      <Textarea
        ref={textareaRef}
        className="w-[95%] absolute bottom-6 p-2 rounded shadow-xl resize-none"
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