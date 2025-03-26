import ForceGraph3D, { ForceGraphMethods } from "react-force-graph-3d";
import { useEffect, useState, useRef } from "react";
import NeoAccessor from "@repo/db/neo";
import {type GenericPaper } from "@repo/db/convert"
import { chosenPaper, makeChosenPaper } from "../page";
import { useGraphDataContext } from "./GraphDataContext";
import ExtractionDisplay from "@/components/display/ExtractionDisplay";


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

  const [hoverNodeID, setHoverNodeID] = useState<string>("");
  const [selectedPapersNeighbors,setSelectedPapersNeighbors] = useState<Set<string>>(new Set());
  
  const {graphData} =  useGraphDataContext();
  
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
      const linkForce = graphRef.current.d3Force("link");
      if (linkForce) {
        linkForce.distance(100); // TODO configure
        graphRef.current.refresh(); 
      }
    }
  }, [graphData])

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

  const handleNodeHover = async function (node: any) {
    if (!node || hoverNodeID === node.id) return;
    setHoverNodeID(node.id || null);
  };

  const handleNodeClick = async function (node: any) {
    zoomOntoNode(node);
    if (chosenPapers.find((paper) => paper.arxiv === node.id)) return;
    const {paper}: {paper:GenericPaper} = await NeoAccessor.getPaper(node.id);
    openSideBar();
    addUniqueChosenPapers([paper])
    setSelectedPaper(paper.arxiv);
  };

  // const handleEdgeClick = async function ({ source, target }:{source:any,target:any}) {
    
  //   if (
  //     chosenPapers.find(
  //       (paper) => paper.arxiv === source.id || paper.arxiv === target.id,
  //     )
  //   )
  //     return;
  //   const [{paper:sourcePaper}, {paper:targetPaper}] = await Promise.all([
  //     NeoAccessor.getPaper(source.id),
  //     NeoAccessor.getPaper(target.id),
  //   ]);
  //   if (sourcePaper && targetPaper) {
  //     openSideBar();
  //     addUniqueChosenPapers([sourcePaper,targetPaper])
  //   }
  // };


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
    if (node.id === hoverNodeID) return "rgb(0,0,139,1)"
    if (selectedPapersNeighbors.has(node.id)) return "rgb(255,204,0,1)" 
    if (!node.extracted) return "rgb(128, 128, 128)"
    return "rgba(0,255,255,0.6)";

  };
  const setNodeSize = function (node): number {
    return Math.trunc(5 * 20 ** (Math.min(100,node.refCount)/100))
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
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          nodeLabel={(node) => node.title}
          // onLinkClick={handleEdgeClick} // FIXME: possibly bring back
          // nodeLabel={(node) => `${node.refCount}-${setNodeSize(node)}`}
          nodeVal={setNodeSize}
        />
      )}
    </div>
  );
}


