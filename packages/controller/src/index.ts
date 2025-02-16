import FetchPipeline from "./FetchPipeline.js";
import { TriggerClient } from "@trigger.dev/sdk";
// import { extractReferencesFromPDF } from "@repo/fetch/src/pdfExtracter.js";
import {fetchPaperPDFLink, getReferencedCount,fetchArxivID } from "@repo/fetch/src/urlFetcher.js" 
import { generateSummary } from "@repo/model/src/referanceExtraction.js";
import {PaperExtractor} from "@repo/fetch/src/pdfExtractor.js";

import { logger, task, tasks } from "@trigger.dev/sdk/v3";

import NeoAccessor from "@repo/db/neo";
import { Paper } from "@repo/db/convert";


const paper = await PaperExtractor.fetchPDF("https://arxiv.org/pdf/1706.03762")

const response = await generateSummary(paper)

console.log(response)