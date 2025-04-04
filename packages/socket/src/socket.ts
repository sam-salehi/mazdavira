import { WebSocketServer,WebSocket } from "ws";
import { v4 } from "uuid";
import FetchPipeline from "@repo/controller/src/FetchPipeline.js"
import { SocketMessage, PORT } from "./config";

const wss = new WebSocketServer({ port: PORT });

const connections: Map<UUID,WebSocket> = new Map(); // maintains websocket connections to be called to.
const extraction_counts: Map<UUID,number> = new Map(); // maintains extraction_counts

type Message = {type:"bfs",arxiv:string,depth:number}
type UUID = string

wss.on("connection", (ws: WebSocket,request) => {
    const id: UUID = v4()
    connections.set(id,ws)

  ws.on("message", (message: Buffer) => {
    handleMessage(message,id)
  });

  ws.on("close", () => handleClose(id));
});


// request handlers
function handleMessage(message: Buffer,id:UUID) {
    const json: Message = JSON.parse(message.toString())
    if (json.type === "bfs")  handleBFSRequest(json.arxiv,json.depth,id)
}   

function handleBFSRequest(arxiv:string,depth:number,id:UUID) {
    if (!extraction_counts.has(id)) extraction_counts.set(id,0)
    FetchPipeline.extractPaperWithDepth(
        arxiv,
        depth,
        (arxivIDs:string[]) => onExtractionCallback(arxivIDs,id),
        (delta:number) => updateExtractionCountCallback(delta,id),
    )
}
// callbacks

function onExtractionCallback(arxivIDs:string[],id:UUID) {
    // signals to client that given nodes have been updated and should be refresshed.
    const ws = connections.get(id)
    arxivIDs.forEach((id:string) => {ws.send(JSON.stringify({type:"extract-notice", arxiv: id}))})
    broadcastUpdate(id)
}

function updateExtractionCountCallback(delta:number, id:UUID) {
    // sends net change of calls made in client.
    const ws = connections.get(id)  
    const new_count = extraction_counts.get(id) + delta
    extraction_counts.set(id,new_count) 
    ws.send(JSON.stringify({type:"extract-count-update",extraction_count:new_count} as SocketMessage))
}

// server side handling.
function broadcastUpdate(callerID: UUID) {
    // broadcast new nodes to be rendered to all users except the caller of BFS with callerID
    connections.forEach(function(ws,id) {if (id != callerID) ws.send(JSON.stringify({type:"update-signal"}))})
}

function handleClose(id: string) {
    connections.delete(id)
    extraction_counts.delete(id)
}