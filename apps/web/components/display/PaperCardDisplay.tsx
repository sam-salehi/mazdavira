import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useChatContext } from "@/app/src/ChatContext";

import { X } from "lucide-react";
import { useSideBarContext } from "@/app/src/SideBarContext";
import { useGraphDataContext } from "@/app/src/GraphDataContext";

const maxTitleLength: number = 25;
export default function PaperCard({
  id,
  title,
  year,
  authors,
  link,
  extracted,
  selected,
  onClick,
  onClose,
}: {
  id: string;
  title: string;
  year: number;
  authors: string[];
  link: string;
  extracted: boolean,
  selected: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return selected ? (
    <FullPaperCard
      id = {id}
      title={title}
      year={year}
      authors={authors}
      link={link}
      extracted={extracted}
      onClose={onClose}
    />
  ) : (
    <PartialPaperCard title={title} onClose={onClose} onClick={onClick} />
  );
}

function FullPaperCard({
  id,
  title,
  year,
  authors,
  link,
  extracted,
  onClose,
}: {
  id:string
  title: string;
  year: number;
  authors: string[];
  link: string;
  extracted: boolean;
  onClose: () => void;
}) {
  const { generateSummary, generateQuestionResponse } = useChatContext();
  const { openChat } = useSideBarContext();
  // const {handleSubmit} = useChat({api:"/api/chat" ,id:'chat',body:{pdfLink:link}});
  const handleSummaryGeneration = function () {
    generateSummary(title, link);
    openChat();
  };

  return (
    <>
      <Card className="w-full max-w-2xl h-fit mb-5">
        <CardHeader className="flex-row justify-between">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <X className="cursor-pointer" onClick={onClose} />
        </CardHeader>

    
        {extracted ?
        <>
        <CardContent>
          <p>{parseAuthors(authors)}</p>
          <p className="text-sm text-gray-700">{year}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-1">
          <div className="flex justify-between w-full">
            <Button
              onClick={() => window.open(link, "_blank")?.focus()}
              className="flex items-center gap-2">
              View Paper
            </Button>
            <Button onClick={handleSummaryGeneration}>
              {" "}Generate Summary{" "}
            </Button>
          </div>
          <div className="flex justify-between w-full">
           <PromptBFSButton arxiv={id}/>
            <PromptQuestionButton
              questionEntered={(question: string) =>
                generateQuestionResponse(link, question)
              }
            />
          </div>
        </CardFooter>
        </>: 
        <CardFooter className="flex flex-col gap-1">
        <div className="flex justify-between w-full">
          <Button
            onClick={() => window.open(link, "_blank")?.focus()}
            className="flex items-center gap-2"
          >
            View Paper
          </Button>
          <PromptBFSButton arxiv={id}/>
        </div>
        </CardFooter>
        }
      </Card>

    </>
  );
}

const parseAuthors = function(authors: string[]): string {
  // pareses authors neatly for display
  if (authors.length === 0) return "No Authors Cited"
  if (authors.length === 1) return authors[0] || "Unknown Author"


  let authorsString = authors.slice(0,-1).reduce((acc, val) => acc + val + ", ", "") 
  authorsString += "and " + authors.at(-1) + "." 
  return authorsString
}


function PromptBFSButton({arxiv}: {arxiv:string}) {
  const {callBFS} = useGraphDataContext()
  const [depth,setDepth] = useState<number | "">("")
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyChange =  (val: string) => {
    if (val === "") {
      setDepth("");
      return;
    }
    
    const n = Number(val);
    if (!isNaN(n) && n >= 0) {
      setDepth(Math.min(n, 5)); // Set depth to the minimum of n and 5
    }
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (depth !== 0 && depth !== "") {
        callBFS(arxiv,depth)
        setIsOpen(false);
      }
    }
  };

  return <Popover open={isOpen} onOpenChange={setIsOpen}>
  <PopoverTrigger asChild>
    <Button onClick={() => setIsOpen(true)}>Call BFS</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Input
      placeholder="Enter Depth"
      value={depth?.toString()}
      onChange={(e) => handleKeyChange(e.target.value)}
      onKeyDown={handleKeyDown}
      maxLength={1} // Optional: Limit input length to 1 character
    />
  </PopoverContent>
</Popover>
}

function PromptQuestionButton({
  questionEntered,
}: {
  questionEntered: (question: string) => void;
}) {
  const [question, setQuestion] = useState<string>("");
  const [isOpen,setIsOpen] = useState(false);

  const { openChat } = useSideBarContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      questionEntered(question);
      setIsOpen(false);
      openChat();
    }
  };

  return (
    <Popover open={isOpen}>
      <PopoverTrigger asChild>
        <Button onClick={()=>setIsOpen(true)}>Ask Question</Button>
      </PopoverTrigger>
      <PopoverContent>
        <Input
          placeholder="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </PopoverContent>
    </Popover>
  );
}

export function PartialPaperCard({
  title,
  onClose,
  onClick,
  handleAddBtn,
  isAdded
}: {
  title: string;
  onClose?: () => void;
  onClick?: () => void;
  handleAddBtn?: () => void,
  isAdded?:boolean
}) {

  return (
    <Card className="w-full max-w-2xl cursor-pointer h-fit mb-5" onClick={onClick}>
      <CardHeader className="flex-row justify-between">
        <CardTitle className="text-xl font-bold">
          {title.length > maxTitleLength
            ? title.substring(0, maxTitleLength) + "..."
            : title}
        </CardTitle>
        {onClose && <X className="cursor-pointer" onClick={onClose} />}
      </CardHeader>
      {/* {(authors?.length && year) && 
      <CardContent className="pb-0">
          <p>{authors.reduce((acc, val) => acc + val + ", ")}</p>
          <p className="text-sm text-gray-700">{year}</p>
      </CardContent>
      } */}
      {handleAddBtn ? !isAdded?
                  <Button className="ml-[80%] mb-2" onClick={handleAddBtn} >{" "}Add{" "}</Button>:
                  <Button className="ml-[80%] mb-2" onClick={handleAddBtn} disabled>{" "}Add{" "}</Button>:
                  <></>
      }
    </Card>
  );
}


