import { createContext, ReactNode,useContext,useEffect,useRef,useState } from "react";
import NeoAccessor, {type Edge,type Node, type Paper } from "@repo/db/neo";
import useWebSocket from 'react-use-websocket';
import { ForceGraphMethods } from 'react-force-graph-3d';

// Context provider for nodes passed onto the graph.

const SOCKET_URL = "ws://localhost:8080"

type SocketMessage = {type:"update-signal"} | {type:'extract-notice', arxiv:string} // ? move to config file

interface GraphDataType {
    graphData: {nodes: Node[], links: Edge[]},
    setGraphData: () => void;
    callBFS: (id:string,depth:number) => void,
    graphRef: any,
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





    const graphRef = useRef<ForceGraphMethods<Node, Edge> | undefined>(); // passed to ForceGraph for reference

    
    // * sendMessage sends message to 
    const {sendMessage, lastMessage, readyState} = useWebSocket(SOCKET_URL)

    useEffect(() => {
        if (lastMessage !== null) {
            const msg: SocketMessage = JSON.parse(lastMessage.data)
            console.log("Given message")
            console.log(msg)
            if (msg.type === "update-signal") {
                setCanUpdate(true) // user could add new nodes it they want            
            } else if (msg.type === "extract-notice") {
                addBFSNode(msg.arxiv)
            } else {
                throw new Error("Invalid message recieved from scoket: ")
            }
    }

    },[readyState,lastMessage,readyState])



    // * canUpdate determines wether new data could be displayed since last fetch
      const [canUpdate,setCanUpdate] = useState<boolean>(false); 
    // * newGraphData are those recieved from calling BFS on socket.

    // * lastFetch is ISO 860 string of last fetch time.
      const [lastFetch,setLastFetch] = useState<string>("");
      const updateLastFetch = () =>  {const date = new Date();setLastFetch(date.toString());} 
    function callBFS(arxiv:string,depth:number) {
        sendMessage(JSON.stringify({type:"bfs",arxiv:arxiv,depth:depth}))
    }

    async function fetchAllNewData() { 
        // gets and adds all data to graphData since last fetch
        if (!canUpdate) return
        const {nodes: newNodes,links:newLinks} = await NeoAccessor.getNewGraph(lastFetch)
        // ? how do I handle duplicates
        setGraphData(({ nodes = [], links = [] } = { nodes: [], links: [] }) => {
            return {
                nodes: [...nodes, ...newNodes],
                links: [...links, ...newLinks],
            };
        })
        updateLastFetch()
        setCanUpdate(false) 
    }

    async function addBFSNode(arxiv: string) {
        // get nodes and edges associated to arxiv from graph.
        console.log("Adding new node for ", arxiv)
        // ? what happens with duplicates?
        // fetch related information
        const paper: Paper | undefined = await NeoAccessor.getPaper(arxiv)
        if (paper) {
            const node: Node = parsePaperForGraph(paper)
            const referencingID = await NeoAccessor.getReferncingIDs(arxiv)
            const referencedID = await NeoAccessor.getReferencedIDs(arxiv)
            const newLinks: Edge[] = []
            referencingID.forEach((id) => {
                newLinks.push({source:arxiv,target:id})
            })
            referencedID.forEach((id) => {
                newLinks.push({source:id,target:arxiv})
            })

            // push new information onto graph
            setGraphData(({ nodes = [], links = [] } = { nodes: [], links: [] }) => {
                return {
                    nodes: [...nodes.filter(n => n != node),node],
                    links: [...links, ...newLinks],
                };
            })

        } else {
            console.error("Paper not found in database for ",arxiv)
        }

    }

      const value = {
        graphData,
        setGraphData,
        callBFS,
        graphRef,
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



function parsePaperForGraph(paper: Paper): Node {
    // used to turn type Paper fetched form db suitable for graph.
    return {id: paper.arxiv, title: paper.title, refCount: paper.referenced_count || 0}
}