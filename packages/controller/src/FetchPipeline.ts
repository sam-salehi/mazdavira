import {type paperInfo, type reference} from "@repo/model/src/config.js"
import {fetchPaperPDFLink, getReferencedCount, fetchArxivID} from "@repo/fetch/src/urlFetcher.js" 
import {PaperExtractor} from "@repo/fetch/src/pdfExtractor.js";
import {extractInformation} from "@repo/model/src/referanceExtraction.js"
import NeoAccessor, {Paper, VacuousPaper} from "@repo/db/neo"
import Semaphore from "./semaphore.js"




const LLMSemaphore = new Semaphore(3) 

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
        const extractedPapers: VacuousPaper[] = await this.extractPaper(arxivID,callback)
        extractedPapers.forEach((paper:VacuousPaper) =>this.extractPaperWithDepth(paper.arxiv,depth-1,callback)) // async
    }


    public static async extractPaper(arxivID: string,callback?:(id:string)=>void): Promise<VacuousPaper[]> {
        // get llm to extract information about paper
        // callback defined in extractPaperWithDepth
        if (!arxivID) return [];
        const link = await fetchPaperPDFLink(arxivID)
        if (!link) return []
        const pdf:string = await PaperExtractor.extractMetaData(link);

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
        console.log("outside")
        console.log(srcPaper)
        NeoAccessor.pushExtraction(srcPaper,referencedPapers,callback) // async 
        return referencedPapers
    }

    private static async castToPapers(info: paperInfo): Promise<[Paper,VacuousPaper[]]> {
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

    private static async fetchPaperDetails(p: paperInfo): Promise<Paper> {
        // Helper function to fetch paper details and parse it to standard Paper type format
        // don't extract information about paper if already in db. Just take it out
        const [refCountResult, pdfSourceLinkResult] = await Promise.allSettled([ 
            getReferencedCount(p.arxiv),
            fetchPaperPDFLink(p.arxiv),
            !p.arxiv? fetchArxivID(p.title): p.arxiv
        ]);

        const refCount: number | null = refCountResult.status === 'fulfilled' ? refCountResult.value : null;
        const pdfSourceLink: string | null = pdfSourceLinkResult.status === 'fulfilled' ? pdfSourceLinkResult.value : null;
        // ! remove ||'s
        return {
            title: p.title,
            authors: p.authors,
            institutions: p.institutions || [],
            pub_year: p.pub_year,
            arxiv: p.arxiv || "",
            referencing_count: p.referencing_count || null,
            referenced_count: refCount,
            pdf_link: pdfSourceLink,
            extracted: true
        };
    }


    private static async fetchReferencePaperDetails(p: reference): Promise<VacuousPaper> {
        let paper : VacuousPaper;
        
        const fp = await NeoAccessor.getPaper(p.arxiv)
        if (fp) {
            return {
                title: fp.title,
                arxiv: fp.arxiv,
                pdf_link: fp.pdf_link,
                extracted: false
            }
        } else {
            const pdfLink = await fetchPaperPDFLink(p.arxiv)
            return {
                title: p.title,
                arxiv: p.arxiv,
                pdf_link: pdfLink,
                extracted: false
            }
        }
    }
}