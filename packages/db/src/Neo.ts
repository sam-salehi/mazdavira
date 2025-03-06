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

        const [nodes, edges] = await Promise.all([this.getNodes(),this.getEdges()])
        return {
            nodes: nodes,
            links: edges
        }
    }

    public static async getNewGraph(creation_time:string) {
        // fetches nodes and edges created after creation_time
        const [nodes, edges] = await Promise.all([this.getNodes(creation_time),this.getEdges(creation_time)])
        return {
            nodes: nodes,
            links: edges
        }
    }


    private static async getNodes(creation_time?:string): Promise<Node[]> {
        //returns array of all nodes 

        const QUERY = `
            MATCH (p:Paper)
            ${creation_time && `WHERE p.created_at > $creation_time`}
            RETURN p.title as title, p.arxiv as arxiv, p.referenced_count as refCount
            `

 

        let nodes: Node[] = [];
        const session = driver.session()
        try {
            let result;
            if (creation_time) {
                result = await session.run(QUERY,{creation_time:creation_time})
            } else {
                result = await session.run(QUERY)
            }
            result.records.forEach(rec => nodes.push({id:rec._fields[1], title:rec._fields[0], refCount:rec._fields[2]}))
        } catch (error) {
            console.error("There was an issue fetching all nodes", error)
            throw error
        }

        return nodes
    }


    private static async getEdges(creation_time?:string): Promise<Edge[]> {


        
        const QUERY = `
                MATCH (p:Paper)-[r]->(n:Paper)
                ${creation_time && `WHERE p.created_at > $creation_time`}
                RETURN p.arxiv,n.arxiv
            `


        let edges: Edge[] = [];

        const session = driver.session()
        try {
            let result;
            if (creation_time) {
                result = await session.run(QUERY,{creation_time:creation_time})
            } else {
                result = await session.run(QUERY)
            }
            result.records.forEach(rec => edges.push({source: rec._fields[0], target:rec._fields[1]}))
        } catch (error) {
            console.error("There was in issue fetching all edges", error)
            throw error
        }
        return edges
    }





    public static async getPapersByTitle(title: string): Promise<Paper[]> {
        // fetches papers containing given string inside title, case insensitive.
        const QUERY = `MATCH (p:Paper) 
                       WHERE toLower(p.title) CONTAINS toLower($title) 
                       RETURN p`;
        const session = driver.session();
        let nodePapers;
        try {
            const result = await session.run(QUERY, { title });
            const nodes: Paper[] = result.records.map(record => record._fields[0].properties);
            return nodes;
        } catch (error) {
            console.error("Could not fetch paper by title", error);
            throw error;
        } finally {
            session.close();
        }
        return [];
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

    public static async getReferences(arxiv: string) : Promise<Paper[]> {
        // returns all neighbours referenced by given title. 
        // Returns empty list if paper not found
        const session = driver.session()
        const QUERY = `
            MATCH (paper:Paper)-[r:REFERENCED]->(n)
            WHERE paper.arxiv = $arxiv
            RETURN n
        `
        let referencedPapers: Paper[] = []
        try {
            const result = await session.run(QUERY,{arxiv:arxiv})
            result.records.forEach((res) => referencedPapers.push(NeoAccessor.convertToPaper(res.get('n').properties)))
        } catch (error) {
            console.error(`Issue fetching neighbours of paper ${arxiv}: `,error)
            throw error
        } finally {
            session.close()
            return referencedPapers
        }
    }

    // public static async getReferencing(title: string) : Promise<Paper[]> { // REMOVE:
    //     // Returns all nodes that are referencing the node with given title.
    //     // returns empty list if paper not found
    //     const session = driver.session()
    //     const QUERY = `
    //         MATCH (n)-[r:REFERENCED]->(paper:Paper)
    //         WHERE paper.title = $title
    //         RETURN n
    //     `
    //     let referencingPapers: Paper[] = []
    //     try {
    //         const result = await session.run(QUERY,{title:title})
    //         result.records.forEach((res) => referencingPapers.push(NeoAccessor.convertToPaper(res.get('n').properties)))
    //     } catch (error) {
    //         console.error(`Issue fetching neighbours of paper ${title}: `,error)
    //         throw error
    //     } finally {
    //         session.close()
    //         return referencingPapers
    //     }

    // }

    public static async getReferencesWithDepth(title: string) {
        // probably not required. 
    }

    public static async pushExtraction(paper: Paper, references: Paper[],callback?:(id:string)=>void): Promise<void> {
        // NOTE: only references that have survived the api fetch process are available here
        let paperID:number;
        if (await NeoAccessor.paperExists(paper.arxiv)) {
            paperID = await NeoAccessor.updatePaper(paper,callback)
        } else {
            console.log("Paper does not exist")
            paperID = await NeoAccessor.createPaper(paper,callback)
        }
        await Promise.allSettled(references.map(r => this.pushReference(paperID,r,callback)))
    }


    public static async createPaper(paper:Paper,callback?:(id:string)=>void): Promise<number> {
        const session = driver.session()
        const QUERY =  `CREATE (p:${this.generatePaperQuery(paper)})\nRETURN p`
        try {
            const res = await session.run(
                QUERY,{...paper,created_at: NeoAccessor.getPushTime()}
            )
            const paperID: number = res.records[0]?.get("p").identity
            if (callback) callback("Pushing Paper");
            return paperID
        } catch (error) {
            console.error("Issue creating paper")
            throw error
        } finally {
            session.close()
        }
    }


    public static async updatePaper(paper:Paper,callback?:(id:string)=>void): Promise<number> {
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
            if (callback) callback("Updating Paper");
            return paperID
        } catch (error) {
            console.error(`Issue updating paper with title: ${paper.title}`)
            throw error
        } finally {
            session.close()
        }
    }

    private static async pushReference(paperid: Number, reference: Paper,callback?:(id:string)=>void): Promise<void> {
        const session = driver.session() 
        const QUERY = `
        MATCH (p)
        where id(p) = $paperId
        MERGE (ref: Paper{arxiv:$arxiv}) ON CREATE SET ref += ${this.generatePaperQuery(reference).replace("Paper ","")}
        MERGE (p)-[:REFERENCED]->(ref)
        `
        try {
            const res = await session.run(
                QUERY,
                {paperId: paperid, ...reference,created_at: NeoAccessor.getPushTime()}
            )
            if (callback) callback("Pushing Reference");
        } catch (error) {
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
        const properties = this.getPropertyTable(paper,true)

        // Filter out properties with undefined values and construct the query
        const queryParts = properties
            .filter(prop => prop.value !== undefined && prop.value !== null) 
            .map(prop => `${prop.key}: $${prop.key}`); 
        return `Paper { ${queryParts.join(", ")} }`;
    }

    private static convertToPaper(node: any): Paper {
        const properties = NeoAccessor.getPropertyTable(node,false)
        const definedProps = properties.reduce((acc, { key, value }) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);
        return definedProps as Paper
    }

    private static getPropertyTable(node: any,createDateTime: boolean): Array<{ key: string; value: any }>{
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
        // ISO 8601 Compatible datatime.
        if (createDateTime) properties.push({key:"created_at", value: new Date().toISOString()}) 

        return properties
    }

    private static getPushTime() {
        // used to set Paper.created_at property
        return new Date().toISOString();
    }
}
