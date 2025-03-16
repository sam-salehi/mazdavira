"use client";
import { useState } from "react";
import ForceGraph from "./src/ForceGraph";
import { Sidebar } from "../components/layouts/SideBar";
import SidebarButton from "@/components/ui/SideBarButton";
import { ChatHistoryProvider } from "./src/ChatContext";
import { SidebarProvider } from "./src/SideBarContext";
import { GraphDataProvider } from "./src/GraphDataContext";
import { GenericPaper, FullPaper } from "@repo/db/neo";
import { isFullPaper } from "@repo/db/neo";

export type chosenPaper = {
  title: string;
  year: number;
  authors: string[];
  link: string;
  arxiv: string;
  extracted: boolean,
};

export const makeChosenPaper = function(gp: GenericPaper): chosenPaper {
  // conversts GenericPaper to chosenPaper for UI display handling difference between Paper and VaccuosusPaper.
  const result: chosenPaper = {
    title:gp.title,
    year: 0,
    authors: [],
    link: gp.pdf_link || "",
    arxiv: gp.arxiv,
    extracted: gp.extracted
  }
  if (isFullPaper(gp)) {
    const paper: FullPaper = gp as FullPaper 
    result.authors = paper.authors
    result.year = paper.pub_year
  }
  return result
}

export default function Home() {
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const [chosenPapers, setChosenPapers] = useState<chosenPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string>(""); // arxivID of selected paper on sidebar


  return (
    <div className="bg-black h-full">
      {/* <span className='text-4xl text-red-500'> This is some text</span> */}
      <GraphDataProvider>
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
      </GraphDataProvider>
    </div>
  );
}
