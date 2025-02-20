import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, X } from "lucide-react"
import { Button } from "../ui/button";

import SummaryDisplay from "./SummaryDisplay";





const maxTitleLength: number = 25;
export default function PaperCard({ id,title, year, authors, summary, link, selected,onSummaryGeneration, onClick, onClose} : {id:string,title:string, year:number, authors:string[], link:string, summary?:string, selected:boolean,onSummaryGeneration:(id:string,pdfLink:string,callback: ()=>void,errorCallback:()=>void)=>void , onClick:()=>void,onClose:()=>void}){

    return selected? 
        <FullPaperCard id={id} title={title} year={year} authors={authors} link={link} summary={summary} onClose={onClose} onSummaryGeneraton={onSummaryGeneration}/> :
        <PartialPaperCard title={title} onClose={onClose} onClick={onClick}/>
}


export type SummaryStatus = "available"|"generating"|"rest"|"view"|"error"

function FullPaperCard({id, title, year, authors, link, summary,onClose,onSummaryGeneraton} : {id:string,title:string, year:number, authors:string[], link:string, summary?:string,onClose:()=>void, onSummaryGeneraton:(id:string,pdfLink:string,callback: ()=>void,errorCallback:()=>void)=>void }) {

    const [summaryStatus,setSummaryStatus] = useState<SummaryStatus>("rest")

    const handleSummaryGeneration = function() {
        setSummaryStatus("generating")
        onSummaryGeneraton(id,link,()=>setSummaryStatus("view"),()=>setSummaryStatus("error"))
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
  if (summaryStatus === "generating" || summaryStatus === "error") return <Button disabled variant="ghost">
                                              <Loader2 className="animate-spin" />
                                              Generating
                                              {summaryStatus === "error" }
                                              </Button> //TODO: setup using shadcn popover. Muscle Through
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