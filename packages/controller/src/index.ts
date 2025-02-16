import FetchPipeline from "./FetchPipeline.js";
import { TriggerClient } from "@trigger.dev/sdk";
// import { extractReferencesFromPDF } from "@repo/fetch/src/pdfExtracter.js";
import {fetchPaperPDFLink, getReferencedCount} from "@repo/fetch/src/urlFetcher.js" 

import { logger, task, tasks } from "@trigger.dev/sdk/v3";

// console.log( process.env.TRIGGER_API_KEY)


// const response = await tasks.trigger("fetch-paper",{arxivId: "1706.03762"})
// console.log(response)
// const k  = await fetchPaperPDFLink("1706.03762")
// console.log(k)



const res = await FetchPipeline.extractPaperWithDepth('1412.1602',2)
// console.log("Hello")