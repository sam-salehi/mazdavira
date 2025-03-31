import { error, QueryConfig, ResultSummary, session } from "neo4j-driver";
import driver from "../../db/src/config.js";
import { string } from "zod";
import { GenericPaper, VacuousPaper, FullPaper, isFullPaper, makeVacuousPaper,Node, Edge} from "./convert.js";

function getPushTime() {
    // used to set Paper.created_at property
    return new Date().toISOString();
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

    public static async getNodes(creation_time?:string): Promise<Node[]> {
        //returns array of all nodes.
        // does so for nodes after creation_time, if creation_time has been provided.

        const QUERY = `
            MATCH (p:Paper)
            ${creation_time ? `WHERE p.created_at > $creation_time` : ""}
            RETURN p.title as title, p.arxiv as arxiv, COUNT{()-[:REFERENCED]->(p)} as refCount, p.extracted as extracted
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
            
            result.records.forEach(rec => nodes.push({id:rec._fields[1], title:rec._fields[0], refCount: rec._fields[2], extracted: rec._fields[3]}))
        } catch (error) {
            console.error("There was an issue fetching all nodes", error)
            throw error
        }
        return nodes
    }

    private static async getEdges(creation_time?:string): Promise<Edge[]> {
        const QUERY = `
                MATCH (p:Paper)-[r]->(n:Paper)
                ${creation_time ? `WHERE p.created_at > $creation_time` : ""}
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





    public static async getPapersByTitle(title: string): Promise<FullPaper[]> {
        // fetches papers containing given string inside title, case insensitive.
        const QUERY = `MATCH (p:Paper) 
                       WHERE toLower(p.title) CONTAINS toLower($title) 
                       RETURN p`;
        const session = driver.session();
        let nodePapers;
        try {
            const result = await session.run(QUERY, { title });
            const nodes: FullPaper[] = result.records.map(record => record._fields[0].properties);
            return nodes;
        } catch (error) {
            console.error("Could not fetch paper by title", error);
            throw error;
        } finally {
            session.close();
        }
        return [];
    }

    public static async getPaper(arxiv: string): Promise<{paper:GenericPaper,refCount:number}>{
        // gets paper with given arxivdID. Requires paper to exist in graph
        const QUERY = `
            MATCH (p:Paper {arxiv: $arxiv})
            RETURN p, COUNT{()-[:REFERENCED]->(p)} as refCount
            LIMIT 1
            `
        const session = driver.session();
        try {
            const result = await session.run(QUERY,{arxiv:arxiv})
            if (result.records[0]) {
                const nodePaper = QueryHelper.convertToPaper(result.records[0].get('p').properties)
                const refCount = result.records[0]._fieldLookup?.refCount
                return {paper:nodePaper,refCount:refCount}
            }
            throw new Error(`Paper with arxivID ${arxiv} was not found`)
        } catch (error) {
            throw error
        } finally {
            session.close()
        }
    }


    public static async isPaperExtracted(arxiv: string): Promise<boolean> {
        const session = driver.session()
        const QUERY = `
            MATCH (paper:Paper)    
            WHERE paper.arxiv = $arxiv
            RETURN paper.extracted
        `
        const result = await session.run(QUERY,{arxiv:arxiv})
        const isExtracted = result.records[0]?.get('paper.extracted') || false
        session.close()
        return isExtracted
    }


    public static async getReferences(arxiv: string) : Promise<GenericPaper[]> {
        // returns all neighbours referenced by given title. 
        // Returns empty list if paper not found
        const session = driver.session()
        const QUERY = `
            MATCH (paper:Paper)-[r:REFERENCED]->(n)
            WHERE paper.arxiv = $arxiv
            RETURN n
        `
        let referencedPapers: GenericPaper[] = []
        try {
            const result = await session.run(QUERY,{arxiv:arxiv})
            result.records.forEach((res) => referencedPapers.push(QueryHelper.convertToPaper(res.get('n').properties)))
        } catch (error) {
            console.error(`Issue fetching neighbours of paper ${arxiv}: `,error)
            throw error
        } finally {
            session.close()
            return referencedPapers
        }
    }

    public static async isFullPaperExtracted(arxiv:string): Promise<boolean> {

        const session = driver.session()
        const QUERY = `
            MATCH (p:Paper {arxiv: $arxiv})
            RETURN p.extracted
        `
        try {
            const result = await session.run(QUERY,{arxiv: arxiv})
            return !!result.records[0]?.get('p.extracted')
        } catch (error) {   
            console.error(`Was not able to see wether ${arxiv} was extracted`, error)
            throw error
        }
    }



    public static async getReferencedIDs(arxiv: string): Promise<string[]> {
        // directly fetch all nodes that given paper is referenced by
        const session = driver.session();
        const result = await session.run(
            'MATCH (p:Paper)-[:REFERENCED]->(target:Paper {arxiv: $arxiv}) RETURN p.arxiv',
            { arxiv }
        );
        session.close()
        const res = result.records.map(record => record.get('p.arxiv'));
        return res
    }

    public static async getReferencingIDs(arxiv: string): Promise<string[]> {
        // directly fetch all nodes that given paper is referencing
        const session = driver.session();
        const result = await session.run(
            'MATCH (source:Paper {arxiv: $arxiv})-[:REFERENCED]->(p:Paper) RETURN p.arxiv',
            { arxiv }
        );
        await session.close();
        const res = result.records.map(record => record.get('p.arxiv'))
        console.log("Recieved referenced IDS: ", res)
        return res;
    }


    public static async pushExtraction(paper: FullPaper, references: VacuousPaper[],callback?:(id:string[])=>void): Promise<void> {
        // NOTE: only references that have survived the api fetch process are available here
        let paperID:number;
        if (await NeoAccessor.paperExists(paper.arxiv)) {
            paperID = await NeoAccessor.updatePaper(paper,callback)
        } else {
            paperID = await NeoAccessor.createPaper(paper,callback)
        }
        await Promise.allSettled(references.map(r => this.pushReference(paperID,r,callback)))
    }


    public static async createPaper(paper:GenericPaper,callback?:(id:string[])=>void): Promise<number> {
        const session = driver.session()
        const QUERY =  `CREATE (p:${QueryHelper.generatePaperQuery(paper)})\nRETURN p`
        try {
            const res = await session.run(
                QUERY,{...paper,created_at: getPushTime()}
            )
            const paperID: number = res.records[0]?.get("p").identity
            if (callback) callback([paper.arxiv]);
            return paperID
        } catch (error) {
            console.error("Issue creating paper")
            throw error
        } finally {
            session.close()
        }
    }
    public static async updatePaper(paper:FullPaper,callback?:(id:string[])=>void): Promise<number> {
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
                {arxiv:paper.arxiv,properties:paper}
            )
            const paperID: number = res.records[0]?.get("p").identity   
            if (callback) callback([paper.arxiv]);
            return paperID
        } catch (error) {
            console.error(`Issue updating paper with title: ${paper.title}`)
            console.log(paper)
            throw error
        } finally {
            session.close()
        }
    }

    private static async pushReference(paperid: Number, reference: VacuousPaper,callback?: (arxiv:string[])=>void): Promise<void> {
        // connects the given refeerence to the paper with Neo4j identifier paperid. 
        // if such reference does't exist, it crates vaccuous node.
        // ** references only need to be Vacuous on extraction from another paper
        console.log("Pushing reference", reference)
        console.log("Generated Query: ", QueryHelper.generatePaperQuery(reference).replace("Paper ",""))


        const session = driver.session() 
        const QUERY = `
        MATCH (p)
        where id(p) = $paperId
        MERGE (ref: Paper{arxiv:$arxiv}) ON CREATE SET ref += ${QueryHelper.generatePaperQuery(reference).replace("Paper ","")}
        MERGE (p)-[:REFERENCED]->(ref)
        `
        try {
            const res = await session.run(
                QUERY,
                {paperId: paperid, ...reference,created_at: getPushTime()}
            )
            if (callback) callback([reference.arxiv])
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
}

class QueryHelper {

    public static generatePaperQuery(paper:GenericPaper) {
        let properties;
        if (isFullPaper(paper)) {
            properties = this.getFullPropertyTable(paper as FullPaper,true)
        } else {
            properties = this.getVacuousPropertyTable(paper as VacuousPaper)
        }

        const queryParts = properties
        .filter(prop => prop.value !== undefined && prop.value !== null) 
        .map(prop => `${prop.key}: $${prop.key}`); 
    return `Paper { ${queryParts.join(", ")} }`;
    }

    public static convertToPaper(node: any): GenericPaper {
        // 
        let properties;
        if (isFullPaper(node)) {
            properties = this.getFullPropertyTable(node,false) 
        } else {
            properties = this.getVacuousPropertyTable(node)
        }
        const definedProps = properties.reduce((acc, { key, value }) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);
        return definedProps as GenericPaper
    }

    private static getFullPropertyTable(node: FullPaper,createDateTime: boolean): Array<{ key: string; value: any }>{
        const properties: Array<{ key: string; value: any }> = [
            { key: "title", value: node.title },
            { key: "authors", value: node.authors },
            { key: "institutions", value: node.institutions },
            { key: "pub_year", value: node.pub_year },
            { key: "arxiv", value: node.arxiv },
            { key: "referencing_count", value: node.referencing_count },
            { key: "pdf_link", value: node.pdf_link }, 
            {key: "extracted", value: true},
            {key:"tokenization",value:node.tokenization}
        ];

        if (createDateTime) properties.push({key:"created_at", value: getPushTime()})  // FIXME: remove getPushTime from here
        return properties
    }

    private static getVacuousPropertyTable(node: VacuousPaper): Array<{ key: string; value: any }>{
        const properties: Array<{ key: string; value: any }> = [
            { key: "title", value: node.title },
            { key: "arxiv", value: node.arxiv },
            { key: "pdf_link", value: node.pdf_link }, 
            {key: "extracted", value: false} ,
            {key:"created_at", value: getPushTime()}
        ];
        return properties
    }

}