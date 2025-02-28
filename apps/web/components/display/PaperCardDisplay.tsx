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

const maxTitleLength: number = 25;
export default function PaperCard({
  title,
  year,
  authors,
  link,
  selected,
  onClick,
  onClose,
}: {
  id: string;
  title: string;
  year: number;
  authors: string[];
  link: string;
  selected: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return selected ? (
    <FullPaperCard
      title={title}
      year={year}
      authors={authors}
      link={link}
      onClose={onClose}
    />
  ) : (
    <PartialPaperCard title={title} onClose={onClose} onClick={onClick} />
  );
}

function FullPaperCard({
  title,
  year,
  authors,
  link,
  onClose,
}: {
  title: string;
  year: number;
  authors: string[];
  link: string;
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex-row justify-between">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <X className="cursor-pointer" onClick={onClose} />
        </CardHeader>

        <CardContent>
          <p>{authors.reduce((acc, val) => acc + val + ", ")}</p>
          <p className="text-sm text-gray-700">{year}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-1">
          <div className="flex justify-between w-full">
            <Button
              onClick={() => window.open(link, "_blank")?.focus()}
              className="flex items-center gap-2"
            >
              View Paper
            </Button>
            <Button onClick={handleSummaryGeneration}>
              {" "}
              Generate Summary{" "}
            </Button>
          </div>
          <div className="flex justify-between w-full">
            <Button>Call BFS</Button>
            <PromptQuestionButton
              questionEntered={(question: string) =>
                generateQuestionResponse(link, question)
              }
            />
          </div>
        </CardFooter>
      </Card>

    </>
  );
}

function PromptQuestionButton({
  questionEntered,
}: {
  questionEntered: (question: string) => void;
}) {
  const [question, setQuestion] = useState<string>("");

  const { openChat } = useSideBarContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      questionEntered(question);
      openChat();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Ask Question</Button>
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
  authors,
  year,
  onClose,
  onClick,
  handleAddBtn,
  isAdded
}: {
  title: string;
  authors?: string[],
  year?: number,
  onClose?: () => void;
  onClick?: () => void;
  handleAddBtn?: () => void,
  isAdded?:boolean
}) {

  console.log(authors)
  console.log(year)

  return (
    <Card className="w-full max-w-2xl cursor-pointer" onClick={onClick}>
      <CardHeader className="flex-row justify-between">
        <CardTitle className="text-xl font-bold">
          {title.length > maxTitleLength
            ? title.substring(0, maxTitleLength) + "..."
            : title}
        </CardTitle>
        {onClose && <X className="cursor-pointer" onClick={onClose} />}
      </CardHeader>
      {(authors && year) && 
      <CardContent>
          <p>{authors.reduce((acc, val) => acc + val + ", ")}</p>
          <p className="text-sm text-gray-700">{year}</p>
      </CardContent>
      }
      {handleAddBtn ? !isAdded?
                  <Button onClick={handleAddBtn} >{" "}Add{" "}</Button>:
                  <Button onClick={handleAddBtn} disabled variant={"secondary"} className="bg-green-500" >{" "}Add{" "}</Button>:
                  <></>
      }
    </Card>
  );
}


