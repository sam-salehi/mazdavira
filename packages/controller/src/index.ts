import FetchPipeline from "./FetchPipeline.js";
import { TriggerClient } from "@trigger.dev/sdk";
// import { extractReferencesFromPDF } from "@repo/fetch/src/pdfExtracter.js";
import {fetchPaperPDFLink, getReferencedCount} from "@repo/fetch/src/urlFetcher.js" 
import { config } from "dotenv";
config({ path: './src/.env' });

import { logger, task, wait } from "@trigger.dev/sdk/v3";

// console.log( process.env.TRIGGER_API_KEY)

// export const trigger = new TriggerClient({ 
//   id: "eidos",
//   apiKey: process.env.TRIGGER_SECRET_KEY,
// });


export const fetchPaper = task({
  id: "fetch-paper",
  maxDuration: 300,
  run: async (payload: { arxivId: string }) => {
    logger.info("Starting paper fetch", { arxivId: payload.arxivId });
    
    try {
      const papers = await fetchPaperPDFLink(payload.arxivId);
      logger.info("Paper fetch complete", { link: papers });
      return papers;
    } catch (error) {
      logger.error("Paper fetch failed", { error });
      throw error;
    }
  },
});

const response = await fetchPaper.trigger({arxivId: "1706.03762"})
console.log(response)


// const k  = await fetchPaperPDFLink("1706.03762")
// console.log(k)