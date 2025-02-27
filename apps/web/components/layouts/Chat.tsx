'use client';

import { useEffect, useRef, useState } from 'react';

import { useChatContext } from '@/app/src/ChatContext';
import { Textarea } from '../ui/textarea';
import  MarkdownDisplay  from '../display/MarkdownDisplay';



export default function ChatLayout() {

    const {chatHistory,setResponseToDisplayed} = useChatContext()
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // scrolls to bottom of screen when something new is added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    },[chatHistory])

  return (
    <div className="relative flex flex-col w-full h-[95%] mx-auto stretch rounded-lg">
      <div className="space-y-4 rounded-lg mb-2 h-[88%] px-2 pt-4 bg-white overflow-scroll hide-scrollbar" style={{paddingBottom:"75%"}} ref={chatContainerRef}>
        {chatHistory.map((message) => (
          <div key={message.id}>
            <div className="font-bold mb-2">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="prose space-y-2">
              <MarkdownDisplay key={message.id} id={message.id} status={message.status} text={message.text} onFinishedDisplaying={setResponseToDisplayed}/>
            </div>
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
}





const MessageInput = () => {

    const [input,setInput] = useState<string>("")

    const {generateResponse} = useChatContext()

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = () => {// used to make text input get taller to keep text in view
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight+5}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input) {
        generateResponse(input);
        setInput("")
      }
    }
  };

  useEffect(() => {
    handleResize();
  }, [input]);

  return (
    <form>
      <Textarea
        ref={textareaRef}
        className="w-[100%] bg-white absolute bottom-6 p-2 rounded shadow-xl resize-none"
        placeholder="Say something..."
        value={input}
        onChange={(e)=>setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        style={{ height: 'auto' }}
      />
    </form>
  );
};