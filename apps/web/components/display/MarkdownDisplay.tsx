// import { marked } from 'marked';
// import { memo, useMemo } from 'react';
// import ReactMarkdown from 'react-markdown';

// function parseMarkdownIntoBlocks(markdown: string): string[] {
//   const tokens = marked.lexer(markdown);
//   return tokens.map(token => token.raw);
// }

// const MemoizedMarkdownBlock = memo(
//   ({ content }: { content: string }) => {
//     return <ReactMarkdown>{content}</ReactMarkdown>;
//   },
//   (prevProps, nextProps) => {
//     if (prevProps.content !== nextProps.content) return false;
//     return true;
//   },
// );

// MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

// export const MemoizedMarkdown = memo(
//   ({ content, id }: { content: string; id: string }) => {
//     const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

//     return blocks.map((block, index) => (
//       <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
//     ));
//   },
// );

// MemoizedMarkdown.displayName = 'MemoizedMarkdown';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { responseStatus } from '@/app/src/ChatContext';



interface MarkdownStreamerProps {
  id: string;
  text: string; // The string of text to be streamed
  delay?: number; // Optional delay between each character
  status: responseStatus | null
  onFinishedDisplaying: (id:string) => void;
}

const MarkdownStreamer: React.FC<MarkdownStreamerProps> = ({ id,text, delay = 10,status,onFinishedDisplaying }) => {
  const [displayedText, setDisplayedText] = useState<string>('');
 



  useEffect(() => {
    if (status === "displayed") return
    let index = 0;

    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(intervalId); // Clear the interval when done
        onFinishedDisplaying(id)
      }
    }, delay);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [text, delay,status]);


  if (status === "displayed") return <div>
  <ReactMarkdown>{text}</ReactMarkdown>
</div>


  return (
    <div>
      <ReactMarkdown>{displayedText}</ReactMarkdown>
    </div>
  );
};

export default MarkdownStreamer;