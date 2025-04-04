import ForceGraph3D, { ForceGraphMethods } from "react-force-graph-3d";
import { useEffect, useState, useRef } from "react";
import NeoAccessor from "@repo/db/neo";
import {type GenericPaper } from "@repo/db/convert"
import { chosenPaper, makeChosenPaper } from "../page";
import { useGraphDataContext } from "./GraphDataContext";
import ExtractionDisplay from "@/components/display/ExtractionDisplay";
import { useSideBarContext } from "./SideBarContext";

// type of node pased by Neo4j
type GraphNode = {
    id: string;
    title: string;
    refCount: number;
    extracted: boolean;
    tokenization: number[];
    x: number;
    y: number;
    z: number;
}

type GraphLink = {
    source: GraphNode;
    target: GraphNode;
}

interface ForceGraphProps {
  chosenPapers: chosenPaper[];
  setChosenPapers: React.Dispatch<React.SetStateAction<chosenPaper[]>>;
  openSideBar: () => void;
  selectedPaper: string;
  setSelectedPaper: (s: string) => void;
}

export default function ForceGraph({
  chosenPapers,
  setChosenPapers,
  openSideBar,
  selectedPaper,
  setSelectedPaper,
}: ForceGraphProps) {




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
    const force = graphRef.current?.d3Force('link');
    if (force) {
        force.distance((link:GraphLink) => setLinkForce(link.source,link.target));
    }
  }, [graphData]);


  const minLength = 100 
  const maxLength = 5000
  const defaultLength = 1000

  const setLinkForce = function(source:GraphNode,target:GraphNode):number {
    if (!source.extracted || !target.extracted) return minLength
    if (!source.tokenization || !target.tokenization) return defaultLength
    const sim = cosineSim(source.tokenization,target.tokenization)
    return maxLength - (maxLength - minLength)*sim   
  }


  const zoomOntoNode = function (node: GraphNode) {
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

    graphRef.current?.cameraPosition(newPos, node, 3000);
  };



  const handleNodeClick = async function (node: GraphNode) {
    console.log(node)
    zoomOntoNode(node);
    if (chosenPapers.find((paper) => paper.arxiv === node.id)) return;
    const {paper}: {paper:GenericPaper} = await NeoAccessor.getPaper(node.id);
    openNavigation();
    openSideBar();
    addUniqueChosenPapers([paper])
    setSelectedPaper(paper.arxiv);
  };

  const handleEdgeClick = async function ({ source, target }:{source:GraphNode,target:GraphNode}) {
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

  const setNodeColor = function (node:GraphNode): string {
    // add one for those being the neighbor of the selected Paper.
    if (node.id === selectedPaper) return "rgb(220,0,0,1)";
    if (selectedPapersNeighbors.has(node.id)) return "rgb(255,204,0,1)" 
    if (!node.extracted) return "rgb(128, 128, 128)"
    return "rgba(0,255,255,0.6)";

  };
  const setNodeSize = function (node:GraphNode): number {
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
    if (A.length !== B.length) {
        throw new Error(`Invalid dimensions A: ${A?.length}, B: ${B?.length}`);
    }
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;

    for(let i = 0; i < A.length; i++) {
        if (!A[i] || !B[i]) throw new Error("Array can't be indexed")
        dotproduct += safeAt(A,i) * safeAt(B,i);
        mA += safeAt(A,i) * safeAt(B,i);
        mB += safeAt(A,i) * safeAt(B,i);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    return dotproduct / (mA * mB);
}

function safeAt(arr: number[], index: number): number {
  return arr.at(index) || 0;
}
