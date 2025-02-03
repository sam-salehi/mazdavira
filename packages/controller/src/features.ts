
import NeoAccessor from "@repo/db/neo"
import {PaperExtracter} from "@repo/fetch/src/pdfExtracter.js"
import { generateConnectionDetails } from "@repo/model/src/referanceExtraction.js"







export default class Features {



    public static async findConnection(title1:string, title2:string): Promise<string> {
        return await this.findConnectionWithQuestion(title1,title2,"")
    }


    public static async findConnectionWithQuestion(title1: string, title2: string, userQuestion: string): Promise<string> {
         // REQURIES: title1 and title2 to exist in the database
        // TODO:

        // fetch urls for title from db
        const [link1, link2] = await Promise.all([NeoAccessor.getPaperPDFLink(title1),NeoAccessor.getPaperPDFLink(title2)])
        // fetch pdf from these pdf urls

        console.log(link1)
        console.log(link2)

        const [pdf1, pdf2] = await Promise.all([PaperExtracter.extractBody(link1),PaperExtracter.extractBody(link2)])

        // prompt the model
        const response:string = await generateConnectionDetails(pdf1,pdf2,userQuestion)
        return response
    }


}