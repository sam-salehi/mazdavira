import { WebSocketServer,WebSocket } from "ws";
import { v4 } from "uuid";
import FetchPipeline from "@repo/controller/src/FetchPipeline.js"



const wss = new WebSocketServer({ port: 8080 });

let connections: Map<string,WebSocket> = new Map()

type Message = {type:"bfs",arxiv:string,depth:number}
type UUID = string

wss.on("connection", (ws: WebSocket,request) => {
    console.log("New client connected");
    const id: UUID = v4()
    console.log("Declared as ", id)
    connections.set(id,ws)

  ws.on("message", (message: Buffer) => {
    handleMessage(message,id)
  });

  ws.on("close", () => handleClose(id));
});

console.log("WebSocket server running on ws://localhost:8080");

function handleMessage(message: Buffer,id:UUID) {
    const json: Message = JSON.parse(message.toString())
    if (json.type === "bfs") callBFS(json.arxiv,json.depth,(arxivIDs:string[]) => onExtractionCallback(arxivIDs,id))
}

function onExtractionCallback(arxivIDs:string[],id:UUID) {
    const ws = connections.get(id)
    console.log("Sending update out for", arxivIDs)
    arxivIDs.forEach((id:string) => {ws.send(JSON.stringify({type:"extract-notice", arxiv: id}))})
    broadcastUpdate(id)
}

function broadcastUpdate(callerID: UUID) {
    // broadcast new nodes to be rendered to all users except the caller of BFS with callerID
    connections.forEach(function(ws,id) {if (id != callerID) ws.send(JSON.stringify({type:"update-signal"}))})
}

function callBFS(arxiv:string,depth:number, callback: (arxivIDs:string[]) => void) {
    FetchPipeline.extractPaperWithDepth(arxiv,depth,callback)
}

function handleClose(id: string) {
    connections.delete(id)
    console.log("Closed connection with ", id)
}