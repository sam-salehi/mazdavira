import ForceGraph3D from 'react-force-graph-3d';
import { useEffect, useState } from 'react';
import NeoAccessor, { Edge, Node} from "@repo/db/neo"


export default function ForceGraph() {

  const [graphData, setGraphData] = useState<{nodes: Node[],links: Edge[]}>()

  useEffect(() => {
    const fetchGraph = async () => {
      const data =  await NeoAccessor.getEntireGraph()
      setGraphData(data)
    }
    fetchGraph()
  },[])
    
      // const graphData = NeoAccessor.getEntireGraph()
    
    
      return <div className=''>
        {graphData &&<ForceGraph3D graphData={graphData}/>}
      </div>

}




