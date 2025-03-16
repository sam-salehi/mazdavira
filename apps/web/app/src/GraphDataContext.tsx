import { createContext, ReactNode,useContext,useEffect,useState } from "react";
import NeoAccessor, {type Edge,type Node, type FullPaper, GenericPaper } from "@repo/db/neo";
import useWebSocket from 'react-use-websocket';

// Context provider for nodes passed onto the graph.

const SOCKET_URL = "ws://localhost:8080"

type SocketMessage = {type:"update-signal"} | {type:'extract-notice', arxiv:string} // FIXME: move to config file

interface GraphDataType {
    graphData: {nodes: Node[], links: Edge[]},
    setGraphData: () => void;
    callBFS: (id:string,depth:number) => void,
    updateLastFetch: ()=>void,
}

const GraphDataContext = createContext<GraphDataType |undefined>(undefined)

export const GraphDataProvider: React.FC<{children:ReactNode}> =  ({children})  => {
    const [graphData,setGraphData] = useState<{   
        nodes: Node[];
        links: Edge[];
      } | undefined>();


      useEffect(() => {
        // loads entire graph from backend for intial fetch
        const fetchGraph = async () => {
            const {nodes,links} = await NeoAccessor.getEntireGraph();
            setGraphData({nodes,links})
        }
        fetchGraph()
        updateLastFetch()
      }, [])

    // const graphRef = useRef<ForceGraphMethods<Node, Edge> | undefined>(); // passed to ForceGraph for reference

    
    // * sendMessage sends message to 
    const {sendMessage, lastMessage, readyState} = useWebSocket(SOCKET_URL)

    useEffect(() => {
        if (lastMessage !== null) {
            const msg: SocketMessage = JSON.parse(lastMessage.data)
            if (msg.type === "update-signal") {
                setCanUpdate(true) // user could add new nodes it they want            
            } else if (msg.type === "extract-notice") {
                addBFSNode(msg.arxiv)
            } else {
                throw new Error("Invalid message recieved from scoket: ")
            }
    }},[readyState,lastMessage,readyState])



    // * canUpdate determines wether new data could be displayed since last fetch
      const [canUpdate,setCanUpdate] = useState<boolean>(false); 
    // * newGraphData are those recieved from calling BFS on socket.

    // * lastFetch is ISO 860 string of last fetch time.
      const [lastFetch,setLastFetch] = useState<string>("");
      const updateLastFetch = () =>  {const date = new Date();setLastFetch(date.toString());} 
    function callBFS(arxiv:string,depth:number) {
        // * depth can't be more than five
        if (depth > 5) throw new RangeError(`Depth ${depth} exceeds the maximum allowed value of ${5}.`);
        sendMessage(JSON.stringify({type:"bfs",arxiv:arxiv,depth:depth}))
    }

    async function fetchAllNewData() { 
        // gets and adds all data to graphData since last fetch
        if (!canUpdate) return
        const {nodes: newNodes,links:newLinks} = await NeoAccessor.getNewGraph(lastFetch)
        updateGraphData(newNodes,newLinks)
        updateLastFetch()
        setCanUpdate(false) 
    }

    async function addBFSNode(arxiv: string) {
        // get nodes and edges associated to arxiv from graph.
        // fetch related information
        const paper: GenericPaper | null = await NeoAccessor.getPaper(arxiv);
        if (paper) {
            const fp: FullPaper = paper as FullPaper
            const node: Node = parsePaperForGraph(fp);
            const referencingIDs = await NeoAccessor.getReferencingIDs(arxiv); // those arxiv is referencing
            const referencedIDs = await NeoAccessor.getReferencedIDs(arxiv); // those arxiv is referenced by
            const newLinks: Edge[] = [];
            referencingIDs.forEach((id) => {
                newLinks.push({ source: arxiv, target: id });
            });
            referencedIDs.forEach((id) => {
                newLinks.push({ source: id, target: arxiv });
            });
            // push new information onto graph
            updateNodeInGraphData(node,newLinks); 
        } else {
            console.error("Paper not found in database for ", arxiv);
        }
    }

    const makeEdgeString = (source:string,target:string) =>  `${source}-${target}`

    const makeUpdatedNodes = function(oldNodes: Node[], newNodes: Node[]): Node[]  {
        // newNodes set and oldNodes updated
        const existingNodes = new Map<string,Node>();
        newNodes.forEach((n:Node) => existingNodes.set(n.id,n));
        
        oldNodes.forEach((n:Node) => {
            existingNodes.set(n.id,n)
        })
        return Array.from(existingNodes.values())
    }
    const makeUpdatedEdges = function(oldLinks: Edge[], newLinks: Edge[]): Edge[] {
        const existingLinkIds = new Set(oldLinks.map(link => makeEdgeString(link.source,link.target)));
        const uniqueNewLinks = newLinks.filter(link => !existingLinkIds.has(makeEdgeString(link.source,link.target)));
        return [...oldLinks,...uniqueNewLinks]
    }

    // const makeUpdatedEdges = function(oldLinks: Edge[], newLinks: Edge[], id: string| null): Edge[] {
    //     // id is for the node which we're adding links for
    //     // remove all oldLinks corresponding to id. append with new Links
    //     // TODO tailor for both calling funcitons
    //     const independantLinks = oldLinks.filter(link => (link.source !== id && link.target !== id))
    //     return [...independantLinks,...newLinks]
    // }


    function updateGraphData(newNodes: Node[], newLinks: Edge[]) {
        // adds newNodes and newLinks to graphData without creating duplicates
        setGraphData(({ nodes = [], links = [] } = { nodes: [], links: [] }) => {

            const aggregatedNodes = makeUpdatedNodes(nodes,newNodes)
            const aggregatedLinks = makeUpdatedEdges(links,newLinks)
            
            return {
                nodes: [...aggregatedNodes], 
                links: [...aggregatedLinks], 
            };
        });
    }

    function updateNodeInGraphData(newNode: Node, newLinks: Edge[]) {
        // handle updating individual nodes seperately for memory efficiancy
        console.log("Recieved new links: ", newLinks.length)

        setGraphData(({ nodes = [], links = [] } = { nodes: [], links: [] }) => {
            const nodeIndex = nodes.findIndex((n:Node) => n.id === newNode.id)
            if (nodeIndex === -1) {
                nodes.push(newNode)
            } else {
                nodes[nodeIndex] = newNode
            }
            const aggregatedLinks = makeUpdatedEdges(links,newLinks)

            return {
                nodes: [...nodes], 
                links: [...aggregatedLinks], 
            };
        });
    }
      const value = {
        graphData,
        setGraphData,
        callBFS,
        updateLastFetch
      }
    return <GraphDataContext.Provider value={value}>{children}</GraphDataContext.Provider>
}

export const useGraphDataContext = () => {
    const context = useContext(GraphDataContext)
    if (!context) {
        throw new Error("GraphDataContext used outside provider scope.")
    }
    return context
}

function parsePaperForGraph(paper: FullPaper): Node {
    // used to turn type Paper fetched form db suitable for graph.
    return {id: paper.arxiv, title: paper.title, refCount: paper.referenced_count || 0, extracted: paper.extracted}
}