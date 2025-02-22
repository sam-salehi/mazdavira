'use client';

import { useChat } from '@ai-sdk/react';
import { MemoizedMarkdown } from '../display/MarkdownDisplay';
import { Input } from '../ui/input';

export default function ChatLayout() {
  const { messages } = useChat({
    id: 'chat',
    experimental_throttle: 10,
  });

  return (
    <div className="flex flex-col w-full h-full pt-4 px-2 mx-auto stretch bg-white rounded-lg">
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
  return (
    <form onSubmit={handleSubmit}>
      <Input
        className="fixed w-full bottom-0 p-2 mb-8 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
        placeholder="Say something..."
        value={input}
        onChange={handleInputChange}
      />
    </form>
  );
};