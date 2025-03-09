import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import pdf from "pdf-parse"

export class PaperExtractor {

    public static async extractMetaData(url:string): Promise<string> {
        const paper: string = await PaperExtractor.fetchPDF(url);
        let metadata:string = PaperExtractor.extractTitleSection(paper)
        metadata += PaperExtractor.extractArxivMentions(paper)
        return metadata
    }

    public static async extractBody(url:string): Promise<string> {
        const paper: string = await PaperExtractor.fetchPDF(url);
        const metaIndex = paper.search(/abstract/i)
        const refIndex = paper.search(/references/i)
        if (metaIndex && refIndex) return paper.slice(metaIndex,refIndex)
        return ""
    }

    public static async fetchPDF(url: string): Promise<string> {
        // loads pdf in from url
        let result: string = ""
        try {
            const response = await fetch(url);
            const data = await response.blob();
            const loader = new WebPDFLoader(data);
            const docs = await loader.load();
    
            docs.map(page => result += page.pageContent)
            return result
        } catch (error) {
            console.log(`Could not fetch pdf from ${url}.`)
            console.error(error)
            return result
        }
    }

    private static extractTitleSection(pdfContent: string) {
        const regex = /abstract/i;
        const k = pdfContent.search(regex);
        if (k) return pdfContent.slice(0,k);
        return ""
    }
    


    private static extractArxivMentions(pdfContent: string) : string {
        // finds all lines that have arxiv mentioned and those entire lines
        const lines = pdfContent.split("\n")
        let arxivLines = ""
        for (const line of lines) {
            if (line.toLowerCase().includes("arxiv")){
                arxivLines += line + '\n'
            }
        }
        return arxivLines
    }



    // private static extractReferenceSection(pdfContent: string): string{
    //     const regex = /references/i;
    //     const k = pdfContent.search(regex);
    //     if (k) return pdfContent.slice(k);
    //     return ""
    // }


}


