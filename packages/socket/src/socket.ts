import { WebSocketServer } from "ws";
import { v4 } from "uuid";
import FetchPipeline from "@repo/controller/src/FetchPipeline.js"



const wss = new WebSocketServer({ port: 8080 });

const connections = {}

type Message = {type:"bfs",arxiv:string,depth:number}





wss.on("connection", (ws,request) => {
    console.log("New client connected");
    const id = v4()
    console.log("Declared as ", id)
  connections[id] = ws

  ws.on("message", (message: Buffer) => {
    handleMessage(message)
  });

  ws.on("close", () => handleClose(id));
});

console.log("WebSocket server running on ws://localhost:8080");



function handleMessage(message: Buffer) {
    const json: Message = JSON.parse(message.toString())
    if (json.type === "bfs") callBFS(json.arxiv,json.depth)
}


function broadcastUpdate(arxivID: string) {
    // lets all available connections know 
    console.log("Sending broadcast out for: ", arxivID)
    Object.values(connections).forEach((ws:WebSocket) => {
        ws.send(JSON.stringify({updated: true, arxivID}))
    })
}


// 1. 

// 3. make loading bar to be displayed when user calls BFS until its completed. Setup state. 

function callBFS(arxiv:string,depth:number) {
    FetchPipeline.extractPaperWithDepth(arxiv,1,broadcastUpdate)
}


function handleClose(id) {
    delete connections[id]
    console.log("Closed connection with ", id)
}