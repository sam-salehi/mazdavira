
// import { extractReferencesFromPDF } from "@repo/fetch/src/pdfExtracter.js";
import {fetchPaperPDFLink, getReferencedCount} from "@repo/fetch/src/urlFetcher.js" 

import { logger, task, tasks } from "@trigger.dev/sdk/v3";

// console.log( process.env.TRIGGER_API_KEY)



export const fetchPaper = task({
  id: "fetch-paper",
  maxDuration: 5000,
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



// const res = await fetchPaper.trigger({arxivId:"1706.03762"})