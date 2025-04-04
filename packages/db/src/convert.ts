
export interface GenericPaper {
    title: string,
    arxiv: string,
    extracted: boolean
    pdf_link: string,
    authors: string[]
    institutions: string[],
    pub_year: number,
    referencing_count: number,
    tokenization: number[]
}

// Representing papers that have not been extracted by llm or for just passing basic information around.
export interface VacuousPaper extends GenericPaper {
    authors: []
    institutions: []
    tokenizaton: []
    pub_year: 0
    referencing_count: 0,
    extracted: false
}

// Papers that have been extracted 
export interface FullPaper extends GenericPaper {
    extracted: true
}

export const isFullPaper = function(p: GenericPaper):boolean {
    return p.extracted
  }

export const makeVacuousPaper = function(title:string,arxiv:string,pdf_link:string): VacuousPaper {
    return {
        title: title,
        arxiv: arxiv,
        pdf_link: pdf_link,
        extracted: false
    } as VacuousPaper
}

export type Node = { // used for presenting nodes and edges on Graph visualization.
    id: string; // arxiv id
    title: string;
    refCount: number;
    extracted: boolean // for displaying in dimmer color,
    tokenization:number[]
}

export type Edge = {
    source: string,
    target: string
}

export function parsePaperForGraph(paper: FullPaper,refCount:number): Node {
    // used to turn type Paper fetched from db suitable for graph.
    return {id: paper.arxiv, title: paper.title, refCount:refCount, extracted: paper.extracted, tokenization:paper.tokenization}
}
