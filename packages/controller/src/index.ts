import FetchPipeline from "./FetchPipeline.js";
import { TriggerClient } from "@trigger.dev/sdk";
import axios from "axios"
import * as cheerio from 'cheerio';
// import { extractReferencesFromPDF } from "@repo/fetch/src/pdfExtracter.js";
import {fetchPaperPDFLink, getReferencedCount } from "@repo/fetch/src/urlFetcher.js" 
import { generateSummary } from "@repo/model/src/referanceExtraction.js";
import {PaperExtractor} from "@repo/fetch/src/pdfExtractor.js";

import { logger, task, tasks } from "@trigger.dev/sdk/v3";

import NeoAccessor from "@repo/db/neo";
import { Paper } from "@repo/db/convert";



// const today = new Date();
// today.setDate(today.getDate() - 1);
// const yesterdayISOString = today.toISOString();


// const {nodes,links} = await NeoAccessor.getNewGraph(yesterdayISOString);


// console.log(nodes)
// console.log(links)