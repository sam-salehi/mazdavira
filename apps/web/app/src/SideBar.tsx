import { Button } from "@/components/ui/button"
import { X, ChevronLeft, PanelRightOpen } from "lucide-react";
import { useState } from "react";
// import { Skeleton } from "@/components/ui/skeleton" //TODO: display skeleton when retrieving from database
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"



type chosenPapers = {title:string, year:number, authors:string, link:string,arxiv:string}

  const SampleSelected: chosenPapers[] = [
    {title:"Attention is all you need", year:2002, authors:"Some old men", link:"https://arxiv.org/pdf/1706.03762", arxiv:"12345.213"},
    {title:"SuperConvergance: how is there a possibility of there not being enough papers", year:2002, authors:"Other fuckers", link:"https://arxiv.org/abs/1706.03762", arxiv:"2321.213"},
    {title:"Lifes to short", year:2002, authors:"Some old men", link:"https://arxiv.org/abs/1706.03762", arxiv:"32.213"},
  ]

export function Sidebar({onClose}) {
    // Sidebar is to be used for conversing with the llm and operating on the graph.

    const [selectedPaper, setSelectedPaper] = useState<string>(""); // arxivID of selected paper on sidebar

    const [chosenPapers, setChosenPapers] = useState<chosenPapers[]>(SampleSelected) //FIXME: move to parent component to interact with graph


    return <div className="bg-black fixed border-l border-gray-500 right-0 top-0 h-full w-1/4 p-7">
        <div className="flex justify-between">
        <Button variant={"secondary"} onClick={onClose}>Close</Button>
        <Button variant={"secondary"}>Chat</Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4">
            {chosenPapers.map(paper=> <PaperCard key={paper.arxiv} title={paper.title} authors={paper.authors} link={paper.link} selected={selectedPaper === paper.arxiv} onClick={() => setSelectedPaper(paper.arxiv)} onClose={() => setChosenPapers(chosenPapers.filter((p) => p.arxiv === paper.arxiv))}/>)}
        </div>
        

    </div>
}




const maxTitleLength: number = 25;

function PaperCard({ title, year, authors, link, selected, onClick, onClose} : {title:string, year:number, authors:string, link:string, selected:boolean}){
    return (
      <Card className={!selected? "w-full max-w-2xl cursor-pointer" :"w-full max-w-2xl"} onClick={onClick}>
        <CardHeader className="flex-row justify-between">
          <CardTitle className="text-xl font-bold">{title.length > maxTitleLength ? title.substring(0,maxTitleLength) + "...": title}</CardTitle> 
          {/* // TODO: use tool tip with this. */}
          <X className="cursor-pointer" onClick={onClose}/>
        </CardHeader>
        <CardContent>
          <p>
            Written by {authors} 
          </p>
          <p className="text-sm text-gray-700">Published in {year}</p>
        </CardContent>
        {selected && <CardFooter className="flex flex-col gap-1">
        <div className="flex justify-between w-full">
        <Button 
            onClick={() => window.open(link,"_blank")?.focus()}
            className="flex items-center gap-2"
        >
            View Paper
        </Button>
        <Button>
            Generate Summary
        </Button>
        </div>
        <div className="flex justify-between w-full">
        <Button>
            Call BFS
        </Button>
        <Button>
            Prompt Question
        </Button>
        </div>
        </CardFooter>
        }
      </Card>
    );
  };




export function SidebarButton({onClick}) {

    return <Button className="bg-white fixed right-0 top-1/2 transform -translate-y-1/2 h-52 w-2" variant="outline" onClick={onClick}>
        {/* <ChevronLeft />
         */}
         <PanelRightOpen className=""/>
    </Button>
}