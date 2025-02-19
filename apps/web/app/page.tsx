'use client'
import { useState } from 'react';
import ForceGraph from './src/ForceGraph';
import {Sidebar, SidebarButton} from './src/SideBar';



// const SampleSelected: chosenPapers[] = [
//   {title:"Attention is all you need", year:2002, authors:"Some old men", link:"https://arxiv.org/pdf/1706.03762", arxiv:"12345.213"},
//   {title:"SuperConvergance: how is there a possibility of there not being enough papers", year:2002, authors:"Other fuckers", link:"https://arxiv.org/abs/1706.03762", arxiv:"2321.213"},
//   {title:"Lifes to short", year:2002, authors:"Some old men", link:"https://arxiv.org/abs/1706.03762", arxiv:"32.213"},
// ]

export type chosenPaper = {title:string, year:number, authors:string[], summary?:string, link:string,arxiv:string}

export default function Home() {

  const [sideBarOpen,setSideBarOpen] = useState<boolean>(false)
  const [chosenPapers, setChosenPapers] = useState<chosenPaper[]>([]) 
  const [selectedPaper, setSelectedPaper] = useState<string>(""); // arxivID of selected paper on sidebar




  return <div className='bg-black h-full'>
    {/* <span className='text-4xl text-red-500'> This is some text</span> */}
    <ForceGraph chosenPapers={chosenPapers} setChosenPapers={setChosenPapers} selectedPaper={selectedPaper} setSelectedPaper={setSelectedPaper} openSideBar={() => setSideBarOpen(true)}/>
    {sideBarOpen ? <Sidebar selectedPaper={selectedPaper} onSelectPaper={setSelectedPaper} onClose={() => setSideBarOpen(false)} chosenPapers={chosenPapers} setChosenPapers={setChosenPapers}/> : <SidebarButton onClick={() => setSideBarOpen(true)}/>}
  </div>
}





