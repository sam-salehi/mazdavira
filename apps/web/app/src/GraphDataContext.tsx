import { createContext, ReactNode,useContext,useEffect,useState } from "react";
import NeoAccessor, {type Edge,type Node, type FullPaper, GenericPaper } from "@repo/db/neo";
import useWebSocket from 'react-use-websocket';
import { unique } from "next/dist/build/utils";

// Context provider for nodes passed onto the graph.

const SOCKET_URL = "ws://localhost:8080"

type SocketMessage = {type:"update-signal"} | {type:'extract-notice', arxiv:string, extracting_nodes:number} | {type:"extract-count-update",net_extractions:number} // FIXME: move to config file

interface GraphDataType {
    graphData: {nodes: Node[], links: Edge[]},
    setGraphData: () => void;
    callBFS: (id:string,depth:number) => void,
    updateLastFetch: ()=>void,
    fetchingNodesCount: number
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
    
    const [fetchingNodesCount,setFetchingNodesCount] =  useState<number>(0);
    
    // * sendMessage sends message to 
    const {sendMessage, lastMessage, readyState} = useWebSocket(SOCKET_URL)

    useEffect(() => {
        if (lastMessage !== null) {
            const msg: SocketMessage = JSON.parse(lastMessage.data)
            if (msg.type === "update-signal") {
                setCanUpdate(true) // user could add new nodes it they want            
            } else if (msg.type === "extract-notice") {
                addBFSNode(msg.arxiv)
            } else if (msg.type === "extract-count-update") {
                console.log("changing counts by", msg.net_extractions)
                setFetchingNodesCount(count => count + msg.net_extractions)
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
            updateGraphData([node],newLinks); 
        } else {
            throw Error(`Paper ${arxiv} was passed as callback without being saved in database.`)
        }
    }

    const makeEdgeString = (source:string,target:string) =>  `${source}-${target}`


    function updateNodesData(newNodes: Node[]) {
        // adds unique new nodes and updates old nodes in graphData
        // in two strategies for memory efficiency.
        if (newNodes.length > 5) {
            setGraphData(({ nodes = [], links = [] } = { nodes: [], links: [] }) => {
                const existingNodes = new Map<string,Node>();
                nodes.forEach((n:Node) => {
                    existingNodes.set(n.id,n)
                    })
                newNodes.forEach((n:Node) => existingNodes.set(n.id,n))
                return {
                    nodes:Array.from(existingNodes.values()),
                    links
                }
            })
        } else {
            setGraphData(({ nodes = [], links = [] } = { nodes: [], links: [] }) => {
                for (const newNode of newNodes) {
                    const nodeIndex = nodes.findIndex((n:Node) => n.id === newNode.id)
                    if (nodeIndex === -1) {
                        nodes.push(newNode)
                    } else {// update node if exists
                        nodes[nodeIndex] = newNode
                    }
                }
                return {
                    nodes: [...nodes], 
                    links: [...links], 
                };

            })
        }
    }

    function updateEdgesData(newLinks:Edge[]) {
      setGraphData(({ nodes = [], links = [] } = { nodes: [], links: [] }) => {
            const existingNodeIDs = new Set(nodes.map((n) => n.id));
            const existingLinkIDs = new Set(links.map((link) => makeEdgeString(link.source,link.target)))

            const linkFilter = (link: Edge) => (
                !existingLinkIDs.has(makeEdgeString(link.source,link.target)) &&
                existingNodeIDs.has(link.source) &&
                existingNodeIDs.has(link.target)
            )
            const uniqueNewLinks = newLinks.filter(l => linkFilter(l))
            return {nodes:nodes,links:[...links,...uniqueNewLinks]}
        })

    }


 function updateGraphData(newNodes: Node[], newLinks: Edge[]) {
    updateNodesData(newNodes)
    updateEdgesData(newLinks)
 }

      const value = {
        graphData,
        setGraphData,
        callBFS,
        updateLastFetch,
        fetchingNodesCount
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