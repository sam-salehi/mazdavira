import { Button } from "@/components/ui/button"
import { X, PanelRightOpen } from "lucide-react";
// import { Skeleton } from "@/components/ui/skeleton" //TODO: display skeleton when retrieving from database
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

  import { chosenPaper } from "../page";







export function Sidebar({selectedPaper,onSelectPaper,onClose,chosenPapers,setChosenPapers}:{selectedPaper:string,onSelectPaper:(s:string)=>void,onClose:()=>void,chosenPapers:chosenPaper[],setChosenPapers:(papers:chosenPaper[])=>void}) {
    // Sidebar is to be used for conversing with the llm and operating on the graph.

    return <div className="bg-black fixed border-l border-gray-500 right-0 top-0 h-full w-1/4 p-7">
        <div className="flex justify-between">
        <Button variant={"secondary"} onClick={onClose}>Close</Button>
        <Button variant={"secondary"}>Chat</Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4">
            {chosenPapers.map(paper=> <PaperCard key={paper.arxiv} title={paper.title} authors={paper.authors} year={paper.year} link={paper.link} selected={selectedPaper === paper.arxiv} onClick={() => onSelectPaper(paper.arxiv)} onClose={() => setChosenPapers(chosenPapers.length > 1? chosenPapers.filter((p) => p.arxiv !== paper.arxiv):[])}/>)}
        </div>
        

    </div>
}

const maxTitleLength: number = 25;
function PaperCard({ title, year, authors, link, selected, onClick, onClose} : {title:string, year:number, authors:string[], link:string, selected:boolean, onClick:()=>void,onClose:()=>void}){

    return selected? 
        <FullPaperCard title={title} year={year} authors={authors} link={link} onClose={onClose}/> :
        <PartialPaperCard title={title} onClose={onClose} onClick={onClick}/>
}

function FullPaperCard({ title, year, authors, link, onClose} : {title:string, year:number, authors:string[], link:string,onClose:()=>void}) {
    return <Card className="w-full max-w-2xl">
    <CardHeader className="flex-row justify-between">
      <CardTitle className="text-xl font-bold">{title}</CardTitle> 
      <X className="cursor-pointer" onClick={onClose}/>
    </CardHeader>

    <CardContent>
      <p>
        {authors.reduce((acc,val) => acc + val + ", ")} 
      </p>
      <p className="text-sm text-gray-700">{year}</p>
    </CardContent>
    <CardFooter className="flex flex-col gap-1">
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
  </Card>

}

function PartialPaperCard({title,onClose, onClick}: {title:string, onClose:() => void, onClick:() => void}) {
    return       <Card className="w-full max-w-2xl cursor-pointer" onClick={onClick}>
     <CardHeader className="flex-row justify-between">
    <CardTitle className="text-xl font-bold">{title.length > maxTitleLength ? title.substring(0,maxTitleLength) + "...": title}</CardTitle> 
    <X className="cursor-pointer" onClick={onClose}/>
  </CardHeader>
  </Card>

}

export function SidebarButton({onClick}:{onClick: ()=>void}) {

    return <Button className="bg-white fixed right-0 top-1/2 transform -translate-y-1/2 h-52 w-2" variant="outline" onClick={onClick}>
        {/* <ChevronLeft />
         */}
         <PanelRightOpen className=""/>
    </Button>
}