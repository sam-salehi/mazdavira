import {type paperInfo, type reference} from "@repo/model/src/config.js"
import {fetchPaperPDFLink, getReferencedCount} from "@repo/fetch/src/urlFetcher.js" // TODO: extra fetches should be handled outside

export type Paper = {
    title: string,
    authors: string[],
    institutions: string[],
    pub_year: number | null,
    arxiv: string,
    doi: string | null,
    referencing_count: number | null,
    referenced_count: number | null,
    pdf_link: string | null

}



