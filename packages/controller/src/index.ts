import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
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

import Tokenizer from "@repo/model/src/tokenizer.js"



// const today = new Date();
// today.setDate(today.getDate() - 1);
// const yesterdayISOString = today.toISOString();
const pdfLink = "http://arxiv.org/pdf/1706.03762v7"
// const arxiv = PaperExtractor.extractReferenceSection(pdf)
// console.log(arxiv)
const nodes = await NeoAccessor.getPaper("1503.05034")

console.log(nodes)



// 1. Set up embedding algorithm for pdf
// 2. Add embedding to db
// 3. Call algorithm on extraction
// 4. fetch embeddings on front end. (Must do these steps efficiently to prevent slow down.)
// 5. 



// const paper = await PaperExtractor.extractBody(pdfLink)    

// const chunks =  await Tokenizer.generateEmbedding(paper)






