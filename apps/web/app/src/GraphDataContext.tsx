import { createContext, ReactNode,useContext,useEffect,useState } from "react";
import NeoAccessor, { Edge, Node } from "@repo/db/neo";


// Context provider for nodes passed onto the graph.


interface GraphDataType {
    graphData: {nodes: Node[], links: Edge[]}
    setGraphData: () => void,
    callBFS: (id:string) => void,
}

const GraphDataContext = createContext<GraphDataType |undefined>(undefined)

export const GraphDataProvider: React.FC<{children:ReactNode}> =  ({children})  => {


    // TODO: keep time for last fetch
    // on BFS push times onto database
    // if call to API BFS returns sucessfuly then fetch all new elements
  // TODO: make the backend fetching graphData pass in time of last fetch 
  // thus it only gets new elements and appends to previous element
  // after getting new elements handle async loading.


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


 
      const callBFS = (id:string) => {

      };

      const value = {
        graphData,
        setGraphData,
        callBFS,
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

