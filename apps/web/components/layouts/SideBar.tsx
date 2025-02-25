

import { Button } from "@/components/ui/button";
import ChatLayout from "./Chat"
import PaperCard from "../display/PaperCardDisplay";
import { chosenPaper } from "@/app/page";
import { useContext, useState } from "react";
import { createContext } from "react";

// Features.generateSummary("ww.google.com")


// SideBarcontext is used to switch between sidebars
const SideBarContext = createContext<SideBarMethods | undefined>(undefined);
interface SideBarMethods {
    openNavigation: () => void;
    openChat: () => void;
}
export const useSideBarContext = () => {
    const context = useContext(SideBarContext);
    if (!context) {
        throw new Error("SideBarContext must be used within appropriate provider")
    }
    return context
}

export function Sidebar({
  selectedPaper,
  onSelectPaper,
  onClose,
  chosenPapers,
  setChosenPapers,
}: {
  selectedPaper: string;
  onSelectPaper: (s: string) => void;
  onClose: () => void;
  chosenPapers: chosenPaper[];
  setChosenPapers: (papers: chosenPaper[]) => void;
}) {

    const [sidebarTab,setSidebarTab] = useState<"nav"|"chat">("chat");


    const openNavigation = () => setSidebarTab("nav")
    const openChat = () => setSidebarTab("chat")

    const contextValue = {
        openNavigation,
        openChat
    }

  return (
    <div className="bg-black fixed border-l border-gray-500 right-0 top-0 h-full w-1/4 p-7">
      <div className="flex justify-between mb-8">
        <Button variant={"secondary"} onClick={onClose}>
          Close
        </Button>
        {
        sidebarTab === "nav"?
        <Button variant={"secondary"} onClick={openChat}>Chat</Button>:
        <Button variant={"secondary"} onClick={openNavigation}>Navigate</Button>
        }
      </div>
      <SideBarContext.Provider value={contextValue}>
      {sidebarTab === "nav"?
      <div className="grid grid-cols-1 gap-4">
        {chosenPapers.map((paper) => (
          <PaperCard
            key={paper.arxiv}
            id={paper.arxiv}
            title={paper.title}
            authors={paper.authors}
            summary={paper.summary}
            year={paper.year}
            link={paper.link}
            selected={selectedPaper === paper.arxiv}
            onClick={() => onSelectPaper(paper.arxiv)}
            onClose={() =>
              setChosenPapers(
                chosenPapers.length > 1
                  ? chosenPapers.filter((p) => p.arxiv !== paper.arxiv)
                  : [],
              )
            }
          />
        ))}
      </div>:
        <ChatLayout></ChatLayout>
        }
        </SideBarContext.Provider>
    </div>
  );
}

// function ChatLayout() {
//     const {chatHistory} = useChatContext();

//     console.log(chatHistory)

//     return <div className="mt-8 grid grid-cols-1 gap-4">Chat</div>
// }