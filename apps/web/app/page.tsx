"use client";
import { useState } from "react";
import ForceGraph from "./src/ForceGraph";
import { Sidebar } from "../components/layouts/SideBar";
import SidebarButton from "@/components/ui/SideBarButton";
import { ChatHistoryProvider } from "./src/ChatContext";
import { SidebarProvider } from "./src/SideBarContext";

export type chosenPaper = {
  title: string;
  year: number;
  authors: string[];
  link: string;
  arxiv: string;
};

export default function Home() {
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const [chosenPapers, setChosenPapers] = useState<chosenPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string>(""); // arxivID of selected paper on sidebar


  return (
    <div className="bg-black h-full">
      {/* <span className='text-4xl text-red-500'> This is some text</span> */}
      <SidebarProvider>
      <ForceGraph
        chosenPapers={chosenPapers}
        setChosenPapers={setChosenPapers}
        selectedPaper={selectedPaper}
        setSelectedPaper={setSelectedPaper}
        openSideBar={() => setSideBarOpen(true)}
      />
      <ChatHistoryProvider>
        {sideBarOpen ? (
          <Sidebar
            selectedPaper={selectedPaper}
            onSelectPaper={setSelectedPaper}
            onClose={() => setSideBarOpen(false)}
            chosenPapers={chosenPapers}
            setChosenPapers={setChosenPapers}
          />
        ) : (
          <SidebarButton onClick={() => setSideBarOpen(true)} />
        )}
      </ChatHistoryProvider>
      </SidebarProvider>
    </div>
  );
}
