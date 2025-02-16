import FetchPipeline from "./FetchPipeline.js";
import { TriggerClient } from "@trigger.dev/sdk";
// import { extractReferencesFromPDF } from "@repo/fetch/src/pdfExtracter.js";
import {fetchPaperPDFLink, getReferencedCount,fetchArxivID } from "@repo/fetch/src/urlFetcher.js" 

import { logger, task, tasks } from "@trigger.dev/sdk/v3";

// console.log( process.env.TRIGGER_API_KEY)


// const response = await tasks.trigger("fetch-paper",{arxivId: "1706.03762"})
// console.log(response)
// const k  = await fetchPaperPDFLink("1706.03762")
// console.log(k)



// const res = await FetchPipeline.extractPaperWithDepth('1512.02595',2)


// const refCount = await getReferencedCount("1706.03762")
// console.log(refCount)


// const id: string | null = await fetchArxivID("Attention is all you need")
const res = await FetchPipeline.extractPaperWithDepth("1511.03729",2)


// console.log("Hello")