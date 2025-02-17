// import React, { useEffect, useRef } from 'react';

// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// const ForceGraph = () => {
//   const graphRef = useRef();

//   // Sample data - replace with your actual data
//   const graphData = {
//     nodes: [
//       { id: 'node1', name: 'Node 1', group: 1 },
//       { id: 'node2', name: 'Node 2', group: 1 },
//       { id: 'node3', name: 'Node 3', group: 2 },
//     ],
//     links: [
//       { source: 'node1', target: 'node2' },
//       { source: 'node2', target: 'node3' },
//     ]
//   };

//   // Custom node styling
//   const handleNodeStyle = node => {
//     return {
//       color: node.group === 1 ? 'red' : 'blue',
//       size: 8
//     };
//   };

//   useEffect(() => {
//     // Access the ForceGraph instance directly
//     const graph = graphRef.current;
//     if (graph) {
//       // Example of customizing the graph after mount
//       graph.cameraPosition({ z: 140 });
      
//       // Add custom force
//       graph.d3Force('charge').strength(-120);
//     }
//   }, []);

//   return (
//     <Card className="w-full h-screen">
//       <CardHeader>
//         <CardTitle>3D Force Graph</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="h-[600px]">
//           <ForceGraph3D
//             ref={graphRef}
//             graphData={graphData}
//             nodeLabel="name"
//             nodeColor={node => handleNodeStyle(node).color}
//             nodeVal={node => handleNodeStyle(node).size}
//             linkWidth={1}
//             linkColor={() => 'rgba(255,255,255,0.2)'}
//             backgroundColor="#1a1a1a"
//             enableNodeDrag={true}
//             enableNavigationControls={true}
//             showNavInfo={true}
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default ForceGraph