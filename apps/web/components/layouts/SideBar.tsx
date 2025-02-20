import { Button } from "@/components/ui/button"
// import { Skeleton } from "@/components/ui/skeleton" //TODO: display skeleton when retrieving from database
import PaperCard from "../display/PaperCardDisplay"


// Features.generateSummary("ww.google.com")

export function Sidebar({selectedPaper,onSelectPaper,onClose,chosenPapers,setChosenPapers}:{selectedPaper:string,onSelectPaper:(s:string)=>void,onClose:()=>void,chosenPapers:chosenPaper[],setChosenPapers:(papers:chosenPaper[])=>void}) {
    // Sidebar is to be used for conversing with the llm and operating on the graph.

    const generateSummary = async function(arxiv: string,pdfLink:string, callback:()=>void,errorCallback:()=>void) {
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
            callback()
        } catch {
            errorCallback()
        }

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

