

export const PORT = 8080
export const SOCKET_URL = `ws://localhost:${PORT}`


export type SocketMessage = {type:"update-signal"} | {type:'extract-notice', arxiv:string, extracting_nodes:number} | {type:"extract-count-update",extraction_count:number} 


