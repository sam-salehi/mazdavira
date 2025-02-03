import {type paperInfo, type reference} from "@repo/model/src/config.js"
import {fetchPaperPDFLink, getReferencedCount} from "@repo/fetch/src/urlFetcher.js" 
import { PaperExtracter } from "@repo/fetch/src/pdfExtracter.js"
import {extractInformation} from "@repo/model/src/referanceExtraction.js"
import { Paper, TableAccessor } from "@repo/db/convert"
import NeoAccessor from "@repo/db/neo"



export default class FetchPipeline {

    public static async extractPaperWithDepth(arxivID:string | null, depth: number) {
        // REQUIRES: depth >= 0,  
        // arxivID is the id for the root )
        console.log("Extracting with depth: ",depth)
        if (!arxivID || depth === 0) return
        if (depth < 0) throw new Error(`Expect depth to be non-negative, got ${depth}`)
        const extractedPapers: Paper[] = await this.extractPaper(arxivID)
        console.log("Extracted local paper")
        extractedPapers.forEach(paper =>this.extractPaperWithDepth(paper.arxiv,depth-1))
    }


    public static async extractPaper(arxivID: string): Promise<Paper[]> {
        if (!arxivID) return [];
        const link = await fetchPaperPDFLink(arxivID)
        let info: paperInfo | null = null;
        if (link) {
            const pdf:string = await PaperExtracter.extractMetaData(link);
            info = await extractInformation(pdf);
        }
        console.log("Paper extraciton complete")
        console.log(info)
        if (info) {
            const papers: Paper[] = await this.castToPapers(info)
            console.log("Length of paper:" ,papers.length)
            // TableAccessor.pushPapers(papers)
            if (papers[0]) NeoAccessor.pushExtraction(papers[0],papers.slice(1)) //async 
            return papers.slice(1)
        }
        return []
    }

    private static async castToPapers(info: paperInfo): Promise<Paper[]> {
        // used to turn Gemini output to type Paper to be queried into db
        const srcPaper = await this.fetchPaperDetails(info);
        const referencedPapers = await Promise.all(info.references.map(ref => this.fetchPaperDetails(ref)));
        return [srcPaper, ...referencedPapers].filter(paper => paper.arxiv != null); // TEMP: for now only process through papers with avaialble arxiv.
    }


    private static async fetchPaperDetails(p: paperInfo | reference): Promise<Paper> {
        // Helper function to fetch paper details

        const [refCountResult, pdfSourceLinkResult] = await Promise.allSettled([
            getReferencedCount(p.arxiv, p.doi, p.title),
            fetchPaperPDFLink(p.arxiv)
        ]);

        const refCount: number | null = refCountResult.status === 'fulfilled' ? refCountResult.value : null;
        const pdfSourceLink: string | null = pdfSourceLinkResult.status === 'fulfilled' ? pdfSourceLinkResult.value : null;
        return {
            title: p.title,
            authors: p.authors,
            institutions: (p as paperInfo).institutions || [],
            pub_year: p.pub_year,
            arxiv: p.arxiv || null,
            doi: p.doi || null,
            referencing_count: (p as paperInfo).referencing_count || null,
            referenced_count: refCount,
            pdf_link: pdfSourceLink,
        };
    }
    

}