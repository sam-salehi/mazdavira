import ForceGraph3D from "react-force-graph-3d";
import { useEffect, useState, useRef } from "react";
import NeoAccessor, {type GenericPaper } from "@repo/db/neo";
import { chosenPaper, makeChosenPaper } from "../page";
import { useGraphDataContext } from "./GraphDataContext";

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
  console.log(graphData)
  
  const graphRef = useRef()
  

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

  },[selectedPaper,graphData]) // todo make effect get called when adding nodes to graph on call bfs. e.g pass graphData


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
    if (!node || hoverNodeID === node) return;
    setHoverNodeID(node.id || null);
  };

  const handleNodeClick = async function (node: any) {
    zoomOntoNode(node);
    if (chosenPapers.find((paper) => paper.arxiv === node.id)) return;
    const paper: GenericPaper | null = await NeoAccessor.getPaper(node.id);
    console.log("Fetched paper")
    console.log(paper)
    if (paper) {
      openSideBar();
      setChosenPapers([
        makeChosenPaper(paper),
        ...chosenPapers,
      ]);
      setSelectedPaper(paper.arxiv);
    }
  };

  const handleEdgeClick = async function ({ source, target }) {
    if (
      chosenPapers.find(
        (paper) => paper.arxiv === source.id || paper.arxiv === target.id,
      )
    )
      return;
    const [sourcePaper, targetPaper] = await Promise.all([
      NeoAccessor.getPaper(source.id),
      NeoAccessor.getPaper(target.id),
    ]);
    if (sourcePaper && targetPaper) {
      openSideBar();
      setChosenPapers([
        makeChosenPaper(source),
        makeChosenPaper(target),
        ...chosenPapers,
      ]);
    }
  };
  const setNodeColor = function (node): string {
    // add one for those being the neighbor of the selected Paper.
    if (node.id === selectedPaper) return "rgb(220,0,0,1)";
    if (node.id === hoverNodeID) return "rgb(0,0,139,1)"
    if (selectedPapersNeighbors.has(node.id)) return "rgb(255,204,0,1)" 
    if (!node.extracted) return "rgb(128, 128, 128)"
    return "rgba(0,255,255,0.6)";

  };
  return (
    <div className="">
      {graphData && (
        <ForceGraph3D
          ref = {graphRef}
          graphData={graphData}
          backgroundColor="#000000"
          nodeAutoColorBy={"recCount"}
          nodeColor={setNodeColor}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          onLinkClick={handleEdgeClick}
          nodeLabel={(node) => node.title}
          enableNodeDrag={false}
        />
      )}
    </div>
  );
}
