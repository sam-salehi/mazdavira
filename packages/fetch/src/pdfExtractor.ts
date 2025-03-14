import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

export class PaperExtractor {

    public static async extractMetaData(url:string): Promise<string> {
        const paper: string = await PaperExtractor.fetchPDF(url);
        let metadata: string = PaperExtractor.extractTitleSection(paper)
        metadata += PaperExtractor.extractReferenceSection(paper)
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
            console.log(`Could not fetch pdf from ${url}`)
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

    public static extractReferenceSection(pdfContent:string) : string {
        // start with references section till end of line of last arxiv mention in the paper.
        const startingIndex = pdfContent.search(/references/i)

        const regex = /arxiv/gi;
        // get last mention of arxiv references
        let match;
        let lastArxivRef = 0
        while ((match = regex.exec(pdfContent)) !== null) {
            lastArxivRef  = Math.max(lastArxivRef,match.index)
        }

        // get the end of line of last arxiv mentiond
        const remainingPDF = pdfContent.slice(lastArxivRef)
        let lastIndex = lastArxivRef + remainingPDF.search(/\n/)

        return pdfContent.slice(startingIndex,lastIndex)
    }
}


