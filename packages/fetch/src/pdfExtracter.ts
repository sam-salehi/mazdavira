import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";


export class PaperExtracter {

    public static async extractMetaData(url:string): Promise<string> {
        const paper: string = await PaperExtracter.fetchPDF(url);
        let metadata:string = PaperExtracter.extractTitleSection(paper)
        metadata += PaperExtracter.extractReferenceSection(paper)
        return metadata
    }

    public static async extractBody(url:string): Promise<string> {
        const paper: string = await PaperExtracter.fetchPDF(url);
        const metaIndex = paper.search(/abstract/i)
        const refIndex = paper.search(/references/i)
        if (metaIndex && refIndex) return paper.slice(metaIndex,refIndex)
        return ""
    }

    private static async fetchPDF(url: string): Promise<string> {
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
    
    private static extractReferenceSection(pdfContent: string): string{
        // TODO: figure out what to do if paper has multiple references keyword. Same thing should be handled in extract body
        const regex = /references/i;
        const k = pdfContent.search(regex);
        if (k) return pdfContent.slice(k);
        return ""
    }
}

export default PaperExtracter


