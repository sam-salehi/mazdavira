import FetchPipeline from "./FetchPipeline.js";
import { TriggerClient } from "@trigger.dev/sdk";
import axios from "axios"
import * as cheerio from 'cheerio';
// import { extractReferencesFromPDF } from "@repo/fetch/src/pdfExtracter.js";
import {extractArxivId, fetchPaperPDFLink, getReferencedCount } from "@repo/fetch/src/urlFetcher.js" 
import { generateSummary } from "@repo/model/src/referanceExtraction.js";
import {PaperExtractor} from "@repo/fetch/src/pdfExtractor.js";

import { logger, task, tasks } from "@trigger.dev/sdk/v3";

import NeoAccessor from "@repo/db/neo";
import { Paper } from "@repo/db/convert";



// const today = new Date();
// today.setDate(today.getDate() - 1);
// const yesterdayISOString = today.toISOString();

// const pdfLink = "http://arxiv.org/pdf/1706.03762v7"
// const pdfLink = await fetchPaperPDFLink("1706.03762")
// console.log(pdfLink)
// console.log(pdfLink)
// const pdf = await PaperExtractor.fetchPDF(pdfLink)
// const arxiv = PaperExtractor.extractReferenceSection(pdf)
// console.log(arxiv)


// console.log("Fetching pdf")
// const pdfLink = await fetchPaperPDFLink("1706.03762")
// console.log(pdfLink)
// console.log("Recieved pdf")
// const papers = await NeoAccessor.getReferencingIDs("1706.03762")
// console.log(papers)

// FetchPipeline.extractPaperWithDepth("1706.03762",1)