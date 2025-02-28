import { QueryConfig, ResultSummary, session } from "neo4j-driver";
import driver from "../../db/src/config.js";
import { type Paper } from "./convert.js";

// const PAPER_QUERY = "Paper {title:$title, authors:$authors,institutions:$institutions, pub_year:$pub_year, arxiv:$arxiv, doi:$doi, referencing_count:$referencing_count, referenced_count:$referenced_count, pdf_link: $pdf_link}"


export type Node = { // used for presenting nodes and edges on Graph visualization.
    id: string; // arxiv id
    title: string;
    refCount: number;
}

export type Edge = {
    source: string,
    target: string
}




export default class NeoAccessor {


    public static async getEntireGraph() {

        const [nodes, edges] = await Promise.all([this.getAllNodes(),this.getAllEdges()])
        return {
            nodes: nodes,
            links: edges
        }
    }


    private static async getAllNodes(): Promise<Node[]> {
        //returns array of all nodes 

        const QUERY = `
            MATCH (p:Paper)
            RETURN p.title as title, p.arxiv as arxiv, p.referenced_count as refCount
        `
        let nodes: Node[] = [];


        const session = driver.session()
        try {
            const result = await session.run(QUERY)
            result.records.forEach(rec => nodes.push({id:rec._fields[1], title:rec._fields[0], refCount:rec._fields[2]}))
        } catch (error) {
            console.error("There was an issue fetching all nodes", error)
            throw error
        }

        return nodes
    }


    private static async getAllEdges(): Promise<Edge[]> {

        const QUERY = `
            MATCH (p:Paper)-[r]->(n:Paper)
            return p.arxiv,n.arxiv
        `

        let edges: Edge[] = [];

        const session = driver.session()
        try {
            const result = await session.run(QUERY)
            result.records.forEach(rec => edges.push({source: rec._fields[0], target:rec._fields[1]}))
        } catch (error) {
            console.error("There was in issue fetching all edges", error)
            throw error
        }
        return edges
    }




    public static async getPaperByTitle(title:string): Promise<Paper[]> {
        // FIXME: change to getPaperS
        // fetches papers containing given string inside title.
        const QUERY = `MATCH (p:Paper) WHERE p.title CONTAINS $title return p`
        const session = driver.session()
        let nodePapers;
        try {
            const result = await session.run(QUERY,{title})
            const nodes:Paper[] = result.records.map(record => record._fields[0].properties)
            return nodes
        } catch (error) {
            console.error("Could not fetch paper by title", error)
            throw error
        } finally {
            session.close()
        }
        return []
    }

    public static async getPaper(arxiv: string): Promise<Paper | undefined>{
        // gets paper with given arxivdID. Returns null if none exists
        const QUERY = `
            MATCH (p:Paper {arxiv: $arxiv})
            RETURN p
            LIMIT 1
            `
        const session = driver.session();
        let nodePaper;
        try {
            const result = await session.run(QUERY,{arxiv:arxiv})
            const node = result.records[0]?.get('p').properties
            if (node) nodePaper = NeoAccessor.convertToPaper(node)
        } catch (error) {
            console.error(`Issue getting paper with arxiv id ${arxiv}`, error)
            throw error
        } finally {
            session.close()
            return nodePaper
        }
    }

    public static async getPaperPDFLink(title:string): Promise<string>  {
        const QUERY = `
            MATCH (p:Paper {title: $title})
            RETURN p.pdf_link
            LIMIT 1
            `
 
        const session = driver.session()
        let pdfLink: string = "";
        try {
            const result = await session.run(QUERY, { title: title });
            pdfLink = result.records[0]?.get('p.pdf_link') || ""; 
        } catch (error) {
            console.error(`Issue fetching PDF link for paper ${title}: `, error);
        } finally {
            session.close();
            return pdfLink;
        }
    }

    public static async getReferences(title: string) : Promise<Paper[]> { //TODO: getReferences based on arxivID instead
        // returns all neighbours to referenced by given title. 
        // Returns empty list if paper not found
        const session = driver.session()
        const QUERY = `
            MATCH (paper:Paper)-[r:REFERENCED]->(n)
            WHERE paper.title = $title
            RETURN n
        `
        let referencedPapers: Paper[] = []
        try {
            const result = await session.run(QUERY,{title:title})
            result.records.forEach((res) => referencedPapers.push(NeoAccessor.convertToPaper(res.get('n').properties)))
        } catch (error) {
            console.error(`Issue fetching neighbours of paper ${title}: `,error)
            throw error
        } finally {
            session.close()
            return referencedPapers
        }
    }

    public static async getReferencing(title: string) : Promise<Paper[]> { //TODO: getReferencing based on Arxiv ID instead
        // Returns all nodes that are referencing the node with given title.
        // returns empty list if paper not found
        const session = driver.session()
        const QUERY = `
            MATCH (n)-[r:REFERENCED]->(paper:Paper)
            WHERE paper.title = $title
            RETURN n
        `
        let referencingPapers: Paper[] = []
        try {
            const result = await session.run(QUERY,{title:title})
            result.records.forEach((res) => referencingPapers.push(NeoAccessor.convertToPaper(res.get('n').properties)))
        } catch (error) {
            console.error(`Issue fetching neighbours of paper ${title}: `,error)
            throw error
        } finally {
            session.close()
            return referencingPapers
        }

    }

    public static async getReferencesWithDepth(title: string) {
        // probably not required. 
    }

    public static async pushExtraction(paper: Paper, references: Paper[]): Promise<void> {
        // NOTE: only references that have survived the api fetch process are available here
        let paperID:number;
        if (await NeoAccessor.paperExists(paper.arxiv)) {
            paperID = await NeoAccessor.updatePaper(paper)
        } else {
            console.log("Paper does not exist")
            paperID = await NeoAccessor.createPaper(paper)
        }
        await Promise.allSettled(references.map(r => this.pushReference(paperID,r)))
    }


    public static async createPaper(paper:Paper): Promise<number> {
        const session = driver.session()
        const QUERY =  `CREATE (p:${this.generatePaperQuery(paper)})\nRETURN p`
        try {
            const res = await session.run(
                QUERY,paper
            )
            const paperID: number = res.records[0]?.get("p").identity
            return paperID
        } catch (error) {
            console.error("Issue creating paper")
            throw error
        } finally {
            session.close()
        }
    }


    public static async updatePaper(paper:Paper): Promise<number> {
        // assuming that paper exists 
        const session = driver.session()
        const QUERY = `
            MATCH (p:Paper {arxiv: $arxiv})
            SET p += $properties
            RETURN p
        `

        try {
            const res = await session.run(
                QUERY,
                {title:paper.title,arxiv:paper.arxiv,properties:paper}
            )
            const paperID: number = res.records[0]?.get("p").identity
            return paperID
        } catch (error) {
            console.error(`Issue updating paper with title: ${paper.title}`)
            throw error
        } finally {
            session.close()
        }
    }

    private static async pushReference(paperid: Number, reference: Paper): Promise<void> {
        const session = driver.session() // sessions are not thread-aware
        const QUERY = `
        MATCH (p)
        where id(p) = $paperId
        MERGE (ref: Paper{arxiv:$arxiv}) ON CREATE SET ref += ${this.generatePaperQuery(reference).replace("Paper ","")}
        MERGE (p)-[:REFERENCED]->(ref)
        `
        try {
            const res = await session.run(
                QUERY,
                {paperId: paperid, ...reference}
            )
        } catch (error) {
            console.log(paperid)
            console.log(reference)
            console.log(this.generatePaperQuery(reference))
            console.error("Issue pushing References paper",error)
            throw error
        } finally {
            session.close()
        }
    }


    private static async paperExists(arxiv: string): Promise<boolean> {
        // check to see if label Paper if arxivID exists.
        const session = driver.session()
        const checkQuery = ` MATCH (p:Paper {arxiv:$arxiv}) return p`
        try {
            const res = await session.run(
                checkQuery,
                {arxiv: arxiv}
            )
            return res.records.length > 0;
        } catch (error) {
            console.error(`Issue checking wether paper with arxiv id ${arxiv} exists.`)
            throw error
        } finally {
            session.close()
        }
    }


    private static generatePaperQuery(paper: Paper): string {
        // Creates proper cypher query, ignoring nulls
        const properties = this.getPropertyTable(paper)

        // Filter out properties with undefined values and construct the query
        const queryParts = properties
            .filter(prop => prop.value !== undefined && prop.value !== null) 
            .map(prop => `${prop.key}: $${prop.key}`); 
        return `Paper { ${queryParts.join(", ")} }`;
    }

    private static convertToPaper(node: any): Paper {
        const properties = NeoAccessor.getPropertyTable(node)
        const definedProps = properties.reduce((acc, { key, value }) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);
        return definedProps as Paper
    }

    private static getPropertyTable(node: any): Array<{ key: string; value: any }>{
        const properties: Array<{ key: string; value: any }> = [
            { key: "title", value: node.title },
            { key: "authors", value: node.authors },
            { key: "institutions", value: node.institutions },
            { key: "pub_year", value: node.pub_year },
            { key: "arxiv", value: node.arxiv },
            { key: "doi", value: node.doi },
            { key: "referencing_count", value: node.referencing_count },
            { key: "referenced_count", value: node.referenced_count },
            { key: "pdf_link", value: node.pdf_link },
        ];
        return properties
    }
}
