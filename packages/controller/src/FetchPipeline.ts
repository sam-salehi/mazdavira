import {type paperInfo, type reference} from "@repo/model/src/config.js"
import {fetchPaperPDFLink, getReferencedCount, fetchArxivID} from "@repo/fetch/src/urlFetcher.js" 
import {PaperExtractor} from "@repo/fetch/src/pdfExtractor.js";
import {extractInformation} from "@repo/model/src/referanceExtraction.js"
import { Paper } from "@repo/db/convert"
import NeoAccessor from "@repo/db/neo"
import Semaphore from "./semaphore.js"


const LLMSemaphore = new Semaphore(3) // seems reasonable for llm response.

export default class FetchPipeline {

    public static async extractPaperWithDepth(arxivID:string | null, depth: number, callback?: (id:string)=>void) {
        // recursive tree, bfs on a paper and its references
        // REQUIRES: depth >= 0,  
        // arxivID is the id for the root )
        // callback is to be called after a paper or reference is added to DB.
        // This is used to tell server to send a message to front end saying it can display new nodes.
        console.log("Searching with depth ", depth)
        if (!arxivID || depth === 0) return
        if (depth < 0) throw new RangeError(`Expect depth to be non-negative, got ${depth}`)
        const extractedPapers: Paper[] = await this.extractPaper(arxivID,callback)
        console.log("Extracted local paper")
        extractedPapers.forEach(paper =>this.extractPaperWithDepth(paper.arxiv,depth-1,callback)) // async
    }


    public static async extractPaper(arxivID: string,callback?:(id:string)=>void): Promise<Paper[]> {
        // get llm to extract information about paper
        // callback defined in extractPaperWithDepth
        // * calling method alone adds vacuous references to db. 
        if (!arxivID) return [];
        const link = await fetchPaperPDFLink(arxivID)
        if (!link) return []
        const pdf:string = await PaperExtractor.extractMetaData(link);
        console.log("Extracted pdf")
        console.log(pdf)

        await LLMSemaphore.acquire();
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
        info.arxiv = arxivID // just give arxiv yourself for safety
        const [srcPaper, referencedPapers]= await this.castToPapers(info)
        LLMSemaphore.release();

        // TableAccessor.pushPapers(papers)
        if (srcPaper) NeoAccessor.pushExtraction(srcPaper,referencedPapers,callback) //async 
        return referencedPapers
    }

    private static async castToPapers(info: paperInfo): Promise<[Paper,Paper[]]> {
        // used to turn Gemini output to distinct papers to be passed for model extraction.
        const srcPaper = await this.fetchPaperDetails(info);

        console.log("Number of references before filtering for arxiv papers: ",info.references.length)
        // filtering for reference papers that have arxivid's only.
        const references: reference[] = info.references.filter(ref => (ref.arxiv != undefined))
        console.log("Number after filtering: ", references.length)


        const referencedPapers = await Promise.all(references.map(ref => this.fetchPaperDetails(ref)));
        return [srcPaper,referencedPapers]
    }

    private static async fetchPaperDetails(p: paperInfo | reference): Promise<Paper> {
        // Helper function to fetch paper details and parse it to standard Paper type format

        // don't extract information about paper if already in db. Just take it out
        if (p.arxiv) {
            console.log("Returning found paper: ", p.arxiv)
            const paper = await  NeoAccessor.getPaper(p.arxiv)
            if (paper) return paper
        }
    
    
        const [refCountResult, pdfSourceLinkResult] = await Promise.allSettled([
            getReferencedCount(p.arxiv || ""),
            fetchPaperPDFLink(p.arxiv || ""),
            !p.arxiv? fetchArxivID(p.title): p.arxiv
        ]);

        const refCount: number | null = refCountResult.status === 'fulfilled' ? refCountResult.value : null;
        const pdfSourceLink: string | null = pdfSourceLinkResult.status === 'fulfilled' ? pdfSourceLinkResult.value : null;
        return {
            title: p.title,
            authors: p.authors,
            institutions: (p as paperInfo).institutions || [],
            pub_year: p.pub_year,
            arxiv: p.arxiv || "",
            doi: p.doi || null,
            referencing_count: (p as paperInfo).referencing_count || null,
            referenced_count: refCount,
            pdf_link: pdfSourceLink,
        };
    }
    

}