import { Button } from "@/components/ui/button"
import { X, PanelRightOpen, Loader2 } from "lucide-react";
import Features from "@repo/controller/src/features"
// import { Skeleton } from "@/components/ui/skeleton" //TODO: display skeleton when retrieving from database
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

  import { chosenPaper } from "../page";
import { useState } from "react";
import { createPortal } from "react-dom";
import SummaryDisplay from "./SummaryDisplay"




// Features.generateSummary("ww.google.com")

export function Sidebar({selectedPaper,onSelectPaper,onClose,chosenPapers,setChosenPapers}:{selectedPaper:string,onSelectPaper:(s:string)=>void,onClose:()=>void,chosenPapers:chosenPaper[],setChosenPapers:(papers:chosenPaper[])=>void}) {
    // Sidebar is to be used for conversing with the llm and operating on the graph.

    const generateSummary = async function(arxiv: string,pdfLink:string, callback:()=>void) {
        try {
            console.log("Generating summary...");
            const response = await fetch("/api/generateSummary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pdfLink }),
            });
            if (!response.ok) throw new Error("Failed to generate summary");
            const { summary } = await response.json();
            const adaptPaper = (paper: chosenPaper) => 
                paper.arxiv === arxiv ? { ...paper, summary } : paper;
            
            setChosenPapers(chosenPapers.map(adaptPaper));
        } catch (error) {
            console.error("Error:", error);
        }
        callback()
    }



    return <div className="bg-black fixed border-l border-gray-500 right-0 top-0 h-full w-1/4 p-7">
        <div className="flex justify-between">
        <Button variant={"secondary"} onClick={onClose}>Close</Button>
        <Button variant={"secondary"}>Chat</Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4">
            {chosenPapers.map(paper=> <PaperCard key={paper.arxiv} id={paper.arxiv} title={paper.title} authors={paper.authors} summary={paper.summary} year={paper.year} link={paper.link} selected={selectedPaper === paper.arxiv} onSummaryGeneration={generateSummary} onClick={() => onSelectPaper(paper.arxiv)} onClose={() => setChosenPapers(chosenPapers.length > 1? chosenPapers.filter((p) => p.arxiv !== paper.arxiv):[])}/>)}
        </div>
        

    </div>
}

const maxTitleLength: number = 25;
function PaperCard({ id,title, year, authors, summary, link, selected,onSummaryGeneration, onClick, onClose} : {id:string,title:string, year:number, authors:string[], link:string, summary?:string, selected:boolean,onSummaryGeneration:(id:string,pdfLink:string,callback: ()=>void)=>void , onClick:()=>void,onClose:()=>void}){

    return selected? 
        <FullPaperCard id={id} title={title} year={year} authors={authors} link={link} summary={summary} onClose={onClose} onSummaryGeneraton={onSummaryGeneration}/> :
        <PartialPaperCard title={title} onClose={onClose} onClick={onClick}/>
}


type SummaryStatus = "available"|"generating"|"rest"|"view"
function FullPaperCard({id, title, year, authors, link, summary,onClose,onSummaryGeneraton} : {id:string,title:string, year:number, authors:string[], link:string, summary?:string,onClose:()=>void, onSummaryGeneraton:(id:string,pdfLink:string,callback: ()=>void)=>void }) {

    const [summaryStatus,setSummaryStatus] = useState<SummaryStatus>("rest")

    const handleSummaryGeneration = function() {
        setSummaryStatus("generating")
        onSummaryGeneraton(id,link,()=>{setSummaryStatus("view");})
    }

    if (summary) console.log(summary)

    return <><Card className="w-full max-w-2xl">
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
    <SummarizePaperButton summaryStatus={summaryStatus} onSummaryGeneration={handleSummaryGeneration} onOpenSummary={() => setSummaryStatus("view")}/>
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
  {summaryStatus === "view" && <SummaryDisplay summary={summary} onCloseSummary={()=>setSummaryStatus("available")}/> }
  </>

}



function SummarizePaperButton({summaryStatus,onSummaryGeneration, onOpenSummary}:{summaryStatus:SummaryStatus,onSummaryGeneration:()=>void, onOpenSummary:()=>void}) {
    if (summaryStatus === "available" || summaryStatus === "view") return <Button onClick={onOpenSummary}>View Summary</Button> 
    if (summaryStatus === "generating") return <Button disabled variant="ghost">
                                                <Loader2 className="animate-spin" />
                                                Generating
                                                </Button>
    return  <Button onClick={onSummaryGeneration}>Generate Summary</Button>

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

         <PanelRightOpen className=""/>
    </Button>
}