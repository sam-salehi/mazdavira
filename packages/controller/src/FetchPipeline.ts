import {type paperInfo, type reference} from "@repo/model/src/config.js"
import {fetchPaperPDFLink, fetchArxivID} from "@repo/fetch/src/urlFetcher.js" 
import {PaperExtractor} from "@repo/fetch/src/pdfExtractor.js";
import {extractInformation} from "@repo/model/src/referanceExtraction.js"
import NeoAccessor from "@repo/db/neo"
import {FullPaper, GenericPaper, VacuousPaper,makeVacuousPaper} from "@repo/db/convert"
import Semaphore from "./semaphore.js"




const LLMSemaphore = new Semaphore(3) 

export default class FetchPipeline {

    public static async extractPaperWithDepth(arxivID:string, depth: number, paper_extracted_callback?: (id:string[])=>void, extraction_count_callback?: (delta: number) => void) {
        // recursive tree, bfs on a paper and its references
        // REQUIRES: depth >= 0,  
        // arxivID is the id for the root )
        // paper_extracted_callback is to be called after a paper or reference is added to DB.
        // This is used to tell server to send a message to front end saying it can display new nodes.
        if (depth === 0) return
        if (depth < 0) throw new RangeError(`Expect depth to be non-negative, got ${depth}`)
        let extractedPapers: GenericPaper[] = []

        if (extraction_count_callback) {
            extraction_count_callback(1);
            extractedPapers = await this.extractPaper(arxivID,paper_extracted_callback)
            extraction_count_callback(-1);
        } else {
            extractedPapers= await this.extractPaper(arxivID,paper_extracted_callback)
        }

        extractedPapers.forEach((paper:GenericPaper) =>this.extractPaperWithDepth(paper.arxiv,depth-1,paper_extracted_callback,extraction_count_callback)) // async
    }


    public static async extractPaper(arxivID: string,paper_extracted_callback?:(id:string[])=>void): Promise<GenericPaper[]> {
        // get llm to extract information about paper
        // paper_extracted_callback defined in extractPaperWithDepth
        if (!arxivID) return [];
        const link = await fetchPaperPDFLink(arxivID)
        if (!link) return []
        const pdf:string = await PaperExtractor.extractMetaData(link);

        // get all references already if extracted from paper before.
        if (await NeoAccessor.isPaperExtracted(arxivID)) {
            return await NeoAccessor.getReferences(arxivID)
        }

        // await LLMSemaphore.acquire(); // TODO
        let info: paperInfo | undefined = undefined;

        // timeout for exhaustion errors and try again after 5 seconds.
        let errorCount = 0;
        while (!info){
            try {
                info = await extractInformation(pdf);
            } catch (error) {
                errorCount += 1;
                console.error(`Timeout error #${errorCount}: `, error)  
                await new Promise(resolve => setTimeout(resolve,5000))
            }   
        }
        info.arxiv = arxivID // just passing arxiv for safety
        const [srcPaper, referencedPapers]= await this.castToPapers(info)
        // LLMSemaphore.release();
        NeoAccessor.pushExtraction(srcPaper,referencedPapers,paper_extracted_callback) // async 
        return referencedPapers
    }

    private static async castToPapers(info: paperInfo): Promise<[FullPaper,VacuousPaper[]]> {
        // used to turn Gemini output to distinct papers to be passed for model extraction.
        // as well as call api's for further info
        const srcPaper = await this.fetchPaperDetails(info);

        console.log("Reference count before filtering:",info.references.length)
        // filtering for reference papers that have arxivid's only.
        const references: reference[] = info.references.filter(ref => (ref.arxiv != undefined))
        console.log("Reference count after filtering:", references.length)

        const referencedPapers = await Promise.all(references.map(ref => this.fetchReferencePaperDetails(ref)));
        return [srcPaper,referencedPapers]
    }

    private static async fetchPaperDetails(p: paperInfo): Promise<FullPaper> {
        // Helper function to fetch paper details and parse it to standard Paper type format
        // don't extract information about paper if already in db. Just take it out
        const [pdfSourceLinkResult] = await Promise.allSettled([
            fetchPaperPDFLink(p.arxiv),
        ]);

        const pdfSourceLink: string | null = pdfSourceLinkResult.status === 'fulfilled' ? pdfSourceLinkResult.value : null;
        return {
            title: p.title,
            authors: p.authors,
            institutions: p.institutions,
            pub_year: p.pub_year,
            arxiv: p.arxiv ,
            referencing_count: p.referencing_count,
            pdf_link: pdfSourceLink || "",
            extracted: true
        };
    }


    private static async fetchReferencePaperDetails(p: reference): Promise<VacuousPaper> {
        let paper : VacuousPaper;
        
        const fp = await NeoAccessor.getPaper(p.arxiv)
        if (fp) {
            return  makeVacuousPaper(fp.title,fp.arxiv,fp.pdf_link || "")
        } else {
            const pdfLink = await fetchPaperPDFLink(p.arxiv)
            return makeVacuousPaper(p.title,p.arxiv,pdfLink || "")
        }
    }
}