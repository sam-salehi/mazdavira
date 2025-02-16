import {type paperInfo, type reference} from "@repo/model/src/config.js"
import {fetchPaperPDFLink, getReferencedCount, fetchArxivID} from "@repo/fetch/src/urlFetcher.js" 
import { PaperExtracter } from "@repo/fetch/src/pdfExtracter.js"
import {extractInformation} from "@repo/model/src/referanceExtraction.js"
import { Paper, TableAccessor } from "@repo/db/convert"
import NeoAccessor from "@repo/db/neo"
import Semaphore from "./semaphore.js"
// eidos/packages/controller/src/FetchPipeline.ts




const LLMSemaphore = new Semaphore(5)

export default class FetchPipeline {

    public static async extractPaperWithDepth(arxivID:string | null, depth: number) {
        // recursive tree, bfs on a paper and its references
        // REQUIRES: depth >= 0,  
        // arxivID is the id for the root )
        if (!arxivID || depth === 0) return
        if (depth < 0) throw new RangeError(`Expect depth to be non-negative, got ${depth}`)
        const extractedPapers: Paper[] = await this.extractPaper(arxivID)
        console.log("Extracted local paper")
        extractedPapers.forEach(paper =>this.extractPaperWithDepth(paper.arxiv,depth-1))
    }


    public static async extractPaper(arxivID: string): Promise<Paper[]> {
        // get llm to extract information about paper

        console.log("Called")
        if (!arxivID) return [];
        const link = await fetchPaperPDFLink(arxivID)
        if (!link) return []
        const pdf:string = await PaperExtracter.extractMetaData(link);
        await LLMSemaphore.acquire();
        let info: paperInfo = await extractInformation(pdf);
        info.arxiv = arxivID // just give arxiv yourself for safety
        const [srcPaper, referencedPapers]= await this.castToPapers(info)
        LLMSemaphore.release();

        // TableAccessor.pushPapers(papers)
        if (srcPaper) NeoAccessor.pushExtraction(srcPaper,referencedPapers) //async 
        console.log("Returning") 
        return referencedPapers
    }

    private static async castToPapers(info: paperInfo): Promise<[Paper,Paper[]]> {
        // used to turn Gemini output to distinct papers to be passed for model extraction.
        const srcPaper = await this.fetchPaperDetails(info);

        console.log("Number of references before filtering for arxiv papers: ",info.references.length)
        // filtering for reference papers that have arxivid's only.
        const references: reference[] = info.references.filter(ref => ref.arxiv)
        console.log("Number after filtering: ", references.length)


        const referencedPapers = await Promise.all(references.map(ref => this.fetchPaperDetails(ref)));

        return [srcPaper,referencedPapers]
    }

    private static async fetchPaperDetails(p: paperInfo | reference): Promise<Paper> {
        // Helper function to fetch paper details and parse it to standard Paper type format

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