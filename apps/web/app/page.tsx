'use client'
// import fetchArxivPapers from "@repo/arxiv/src/fetchPaper";

// import extractInformation from "@repo/model/src/referanceExtraction"
import { useEffect } from 'react';
import ForceGraph from './src/ForceGraph';
// import sample from "@repo/graph/src/sample.json"


export default function Home() {

  return <div className='bg-black'>
    Hello
    <ForceGraph />
  </div>
}
