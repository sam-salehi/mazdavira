import ForceGraph3D, { ForceGraphMethods } from "react-force-graph-3d";
import { useEffect, useState, useRef } from "react";
import NeoAccessor from "@repo/db/neo";
import {type GenericPaper } from "@repo/db/convert"
import { chosenPaper, makeChosenPaper } from "../page";
import { useGraphDataContext } from "./GraphDataContext";
import ExtractionDisplay from "@/components/display/ExtractionDisplay";
import { Node } from "@repo/db/convert";
import { useSideBarContext } from "./SideBarContext";

type GraphNode = {
    id: string;
    title: string;
    refCount: number;
    extracted: boolean;
    tokenization?: number[];
    x?: number;
    y?: number;
    z?: number;
}

type GraphLink = {
    source: GraphNode;
    target: GraphNode;
}

// FIXME: move to display folder

export default function ForceGraph({
  chosenPapers,
  setChosenPapers,
  openSideBar,
  selectedPaper,
  setSelectedPaper,
}: {
  chosenPapers: chosenPaper[];
  setChosenPapers: (chosen: chosenPaper[]) => void;
  openSideBar: () => void;
  selectedPaper: string;
  setSelectedPaper: (s: string) => void;
}) {




  const [selectedPapersNeighbors,setSelectedPapersNeighbors] = useState<Set<string>>(new Set());
  const {graphData} =  useGraphDataContext();
  const {openNavigation} =  useSideBarContext()

  
  const graphRef = useRef<ForceGraphMethods|null>(null)
  

  useEffect(() => { 
    // pulls neighbours of selectedPaper from backend's id from backend
    // they are in turn used to color edges
    const getNeighbours = async function(arxiv:string) {
      console.log("Adding neighbors")
      const neighbors: GenericPaper[] = await NeoAccessor.getReferences(arxiv)
      const neighborIDs: string[] = neighbors.map(n => n.arxiv)
      setSelectedPapersNeighbors(new Set(neighborIDs))
    }
    getNeighbours(selectedPaper)
  },[selectedPaper,graphData]) 

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('link')
        .distance(link => setLinkForce(link.source,link.target))
    }
  }, [graphData])


  const minLength = 100 
  const maxLength = 5000
  const defaultLength = 1000

  const setLinkForce = function(source:Node,target:Node):number {
    if (!source.extracted || !target.extracted) return minLength
    if (!source.tokenization || !target.tokenization) return defaultLength
    const sim = cosineSim(source.tokenization,target.tokenization)
    return maxLength - (maxLength - minLength)*sim   
  }


  const zoomOntoNode = function (node: any) {
    const distance = 40;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    const newPos =
      node.x || node.y || node.z
        ? {
            x: node.x * distRatio,
            y: node.y * distRatio,
            z: node.z * distRatio,
          }
        : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

    graphRef.current.cameraPosition(newPos, node, 3000);
  };



  const handleNodeClick = async function (node: any) {
    console.log(node)
    zoomOntoNode(node);
    if (chosenPapers.find((paper) => paper.arxiv === node.id)) return;
    const {paper}: {paper:GenericPaper} = await NeoAccessor.getPaper(node.id);
    openNavigation();
    openSideBar();
    addUniqueChosenPapers([paper])
    setSelectedPaper(paper.arxiv);
  };

  const handleEdgeClick = async function ({ source, target }:{source:any,target:any}) {
   
    console.log(graphData.links.filter(l => ((l.source === source && l.target === target) || (l.source === target && l.target == source))))
    const [{paper:sourcePaper}, {paper:targetPaper}] = await Promise.all([
      NeoAccessor.getPaper(source.id),
      NeoAccessor.getPaper(target.id),
    ]);
    if (sourcePaper && targetPaper) {
      openNavigation();
      openSideBar();
      addUniqueChosenPapers([sourcePaper,targetPaper])
    }
  };


  const addUniqueChosenPapers = (papers: GenericPaper[]): void => {
    // adds papers to chosenPapers in sidebar. Ensures there's no duplicates.
    setChosenPapers((existingPapers: chosenPaper[] = []) => {
        const oldPapers = new Set(existingPapers.map(p => p.arxiv));  
        return [...existingPapers, ...papers.filter(p => !oldPapers.has(p.arxiv)).map(makeChosenPaper)];
    });
};

  const setNodeColor = function (node): string {
    // add one for those being the neighbor of the selected Paper.
    if (node.id === selectedPaper) return "rgb(220,0,0,1)";
    if (selectedPapersNeighbors.has(node.id)) return "rgb(255,204,0,1)" 
    if (!node.extracted) return "rgb(128, 128, 128)"
    return "rgba(0,255,255,0.6)";

  };
  const setNodeSize = function (node): number {
    return Math.trunc(5 * 20 ** (Math.min(50,node.refCount)/50))
  }
  return (
    <div className="relative">
      <ExtractionDisplay/>
      {graphData && (
        <ForceGraph3D
          ref = {graphRef}
          graphData={graphData}
          backgroundColor="#000000"
          nodeAutoColorBy={"recCount"}
          nodeColor={setNodeColor}
          onNodeClick={handleNodeClick}
          nodeLabel={(node) => node.title}
          onLinkClick={handleEdgeClick}
          // nodeLabel={(node) => `${node.refCount}-${setNodeSize(node)}`}
          nodeVal={setNodeSize}
        />
      )}
    </div>
  );
}




const cosineSim = function (A:number[], B:number[]):number {
  if (A.length !== B.length) throw new Error(`Dimensions A: ${A.length} and B: ${B.length} do not match up`)
  let dotproduct = 0;
  let mA = 0;
  let mB = 0;

  for(let i = 0; i < A.length; i++) {
      dotproduct += A[i] * B[i];
      mA += A[i] * A[i];
      mB += B[i] * B[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  const similarity = dotproduct / (mA * mB);
  return similarity;
}