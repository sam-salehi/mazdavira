import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { responseStatus } from '@/app/src/ChatContext';
import { ThreeDots } from 'react-loader-spinner'

interface MarkdownDisplayProps {
  id: string;
  text: string; // The string of text to be streamed
  status: responseStatus; // Use the defined responseStatus type
  onFinishedDisplaying: (id: string) => void; // Callback function
}

interface MarkdownStreamerProps {
  id: string;
  text: string; // The string of text to be streamed
  delay?: number; // Optional delay between each character
  onFinishedDisplaying: (id: string) => void; // Callback function
}

const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({id,text,status,onFinishedDisplaying}) => {
  if (status === "displayed") return <div><ReactMarkdown>{text}</ReactMarkdown></div>
  if (status === "generating") return <div><ThreeDots visible={true} height="40" width="40" color="#000020" radius="4" ariaLabel="three-dots-loading"
  /></div>
  return <MarkdownStreamer id={id} text={text} onFinishedDisplaying={onFinishedDisplaying}></MarkdownStreamer>
}




// used to stream llm response onto the page.
const MarkdownStreamer: React.FC<MarkdownStreamerProps> = ({ id, text, delay = 10, onFinishedDisplaying }) => {
  const [displayedText, setDisplayedText] = useState<string>('');

  useEffect(() => {
    let index = 0;

    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index));
        const jump = Math.floor(Math.random() * 5) + 1;
        index = index + jump < text.length ? index + jump : text.length
      } else {
        clearInterval(intervalId); // Clear the interval when done
        onFinishedDisplaying(id);
      }
    }, delay);

    return () => clearInterval(intervalId);
  }, [id,text, delay,onFinishedDisplaying]);

  return (
    <div>
      <ReactMarkdown>{displayedText}</ReactMarkdown>
    </div>
  );
};



export default MarkdownDisplay