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



// const today = new Date();
// today.setDate(today.getDate() - 1);
// const yesterdayISOString = today.toISOString();
// const pdfLink = "http://arxiv.org/pdf/1706.03762v7"
// const arxiv = PaperExtractor.extractReferenceSection(pdf)
// console.log(arxiv)

const pop = FetchPipeline.extractPaperWithDepth("1706.03762",1)

