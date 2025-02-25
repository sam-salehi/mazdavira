
import NeoAccessor from "@repo/db/neo"
import {PaperExtractor} from "@repo/fetch/src/pdfExtractor.js"
import { generateConnectionDetails,generateSummary ,generateQuestionResponse, generateBasicResponse} from "@repo/model/src/referanceExtraction.js"
import type { CoreAssistantMessage, CoreUserMessage } from "ai";
type HistoryMessage = CoreAssistantMessage | CoreUserMessage

export default class Features {
    public static async findConnection(title1:string, title2:string): Promise<string> {
        // TODO: figure out what to do with these (probs disregard)
        return await this.findConnectionWithQuestion(title1,title2,"")
    }

    public static async findConnectionWithQuestion(title1: string, title2: string, userQuestion: string): Promise<string> {
        // fetches the papers with the given titles and finds how they are related. Answers user question based on finding.
        // REQURIES: title1 and title2 to exist in the databases and have a connection
        // TODO:

        // fetch urls for title from db
        const [link1, link2] = await Promise.all([NeoAccessor.getPaperPDFLink(title1),NeoAccessor.getPaperPDFLink(title2)])
        // fetch pdf from these pdf urls


        const [pdf1, pdf2] = await Promise.all([PaperExtractor.extractBody(link1),PaperExtractor.extractBody(link2)])

        // prompt the model
        const response:string = await generateConnectionDetails(pdf1,pdf2,userQuestion)
        return response
    }


    public static async generateBasicResponse(history:HistoryMessage[]):Promise<string> {
        const response = await generateBasicResponse(history)
        return response
    }

    public static async generateSummary(pdfLink:string):Promise<string> {
        // makes a summary of paper at link from model
        const paperPDF = await PaperExtractor.fetchPDF(pdfLink)
        const summary =  await generateSummary(paperPDF)
        return summary
    }

    public static async generateQuestionResponse(pdfLink:string,question:string):Promise<string>{
        const paperPDF = await PaperExtractor.fetchPDF(pdfLink);
        const response =  await generateQuestionResponse(question,paperPDF)
        return response
    }




}