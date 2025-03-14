import ForceGraph3D from "react-force-graph-3d";
import { useEffect, useState, useRef } from "react";
import NeoAccessor, { type Edge, type Node, type GenericPaper } from "@repo/db/neo";
import { chosenPaper } from "../page";
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
  
  const graphRef = useRef()
  

  useEffect(() => { 
    // pulls neighbours of selectedPaper from backend's id from backend
    // they are in turn used to color edges
    const getNeighbours = async function(arxiv:string) {

      const neighbors: GenericPaper[] = await NeoAccessor.getReferences(arxiv)
      const neighborIDs: string[] = neighbors.map(n => n.arxiv)
      setSelectedPapersNeighbors(new Set(neighborIDs))
    }

    getNeighbours(selectedPaper)

  },[selectedPaper])


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
    const paper = await NeoAccessor.getPaper(node.id);
    if (paper) {
      openSideBar();
      setChosenPapers([
        {
          title: paper.title,
          year: paper.pub_year,
          authors: paper.authors,
          link: paper.pdf_link || "",
          arxiv: paper.arxiv,
        },
        ...chosenPapers,
      ]);
      setSelectedPaper(paper.arxiv);
    }
  };

  const handleEdgeClick = async function ({ source, target }) { //FIXME: probably can just remove this
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
        {
          title: source.title,
          year: source.pub_year,
          authors: source.authors,
          link: source.pdf_link,
          arxiv: source.arxiv,
        },
        {
          title: target.title,
          year: target.pub_year,
          authors: target.authors,
          link: target.pdf_link,
          arxiv: target.arxiv,
        },
        ...chosenPapers,
      ]);
    }
  };

  const setNodeColor = function (node): string {
    // add one for those being the neighbor of the selected Paper.
    if (selectedPapersNeighbors.has(node.id)) return "rgb(255,204,0,1)"
    
    switch (node.id) {
      case hoverNodeID:
        return "rgb(0,0,139,1)";
      case selectedPaper:
        return "rgb(220,0,0,1)";
      default:
        return "rgba(0,255,255,0.6)";
    }
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
