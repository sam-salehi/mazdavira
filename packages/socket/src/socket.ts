import { WebSocketServer,WebSocket } from "ws";
import { v4 } from "uuid";
import FetchPipeline from "@repo/controller/src/FetchPipeline.js"
import { number } from "zod";



const wss = new WebSocketServer({ port: 8080 });

let connections: Map<string,WebSocket> = new Map()

type Message = {type:"bfs",arxiv:string,depth:number}
type UUID = string

wss.on("connection", (ws: WebSocket,request) => {
    const id: UUID = v4()
    console.log("Client Connected Declared as ", id)
    connections.set(id,ws)

  ws.on("message", (message: Buffer) => {
    handleMessage(message,id)
  });

  ws.on("close", () => handleClose(id));
});

console.log("WebSocket server running on ws://localhost:8080");

function handleMessage(message: Buffer,id:UUID) {
    const json: Message = JSON.parse(message.toString())
    if (json.type === "bfs")  {
        FetchPipeline.extractPaperWithDepth(
            json.arxiv,
            json.depth,
            (arxivIDs:string[]) => onExtractionCallback(arxivIDs,id),
            (delta:number) => updateExtractionCountCallback(delta,id),
    )
}
    
}   

function onExtractionCallback(arxivIDs:string[],id:UUID) {
    // signals to client that given nodes have been updated and should be refresshed.
    const ws = connections.get(id)
    console.log("Sending update out for", arxivIDs)
    arxivIDs.forEach((id:string) => {ws.send(JSON.stringify({type:"extract-notice", arxiv: id}))})
    broadcastUpdate(id)
}

function updateExtractionCountCallback(delta:number, id:UUID) {
    // sends net change of calls made in client.
    const ws = connections.get(id)  
    console.log("Updating extraction count by ", delta)
    ws.send(JSON.stringify({type:"extract-count-update",net_extractions:delta}))

}


function broadcastUpdate(callerID: UUID) {
    // broadcast new nodes to be rendered to all users except the caller of BFS with callerID
    connections.forEach(function(ws,id) {if (id != callerID) ws.send(JSON.stringify({type:"update-signal"}))})
}

// function callBFS(arxiv:string,depth:number, callback: (arxivIDs:string[]) => void) {
//     FetchPipeline.extractPaperWithDepth(arxiv,depth,callback)
// }

function handleClose(id: string) {
    connections.delete(id)
    console.log("Closed connection with ", id)
}