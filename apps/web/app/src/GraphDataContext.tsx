import { createContext, ReactNode,useContext,useEffect,useState } from "react";
import NeoAccessor, { Edge, Node } from "@repo/db/neo";


// Context provider for nodes passed onto the graph.


interface GraphDataType {
    graphData: {nodes: Node[], links: Edge[]}
    setGraphData: () => void
}

const GraphDataContext = createContext<GraphDataType |undefined>(undefined)

export const GraphDataProvider: React.FC<{children:ReactNode}> =  ({children})  => {



    // TODO: make web socket
  // TODO: make the backend fetching graphData pass in time of last fetch 
  // thus it only gets new elements and appends to previous elements
  // TODO: setup API call in context to be passed down to elementss
  // whenever websocket response useEffect fetches from backend.


    const [graphData, setGraphData] = useState<{
        nodes: Node[];
        links: Edge[];
      }>();


      useEffect(() => { // laods entire graph from backend for inital fetch
        const fetchGraph = async () => {
          const data = await NeoAccessor.getEntireGraph();
          setGraphData(data);
        };
        fetchGraph();
      }, []);


      const value = {
        graphData,
        setGraphData,
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

