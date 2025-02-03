import { Session } from "neo4j-driver";
import driver from "../../db/src/config.js";
import { type Paper } from "./convert.js";

const PAPER_QUERY = "Paper {title:$title, authors:$authors,institutions:$institutions, pub_year:$pub_year, arxiv:$arxiv, doi:$doi, referencing_count:$referencing_count, referenced_count:$referenced_count, pdf_link: $pdf_link}"

export default class NeoAccessor {
    public static async getPaper(title: string): Promise<Paper | undefined>{
        // gets paper with given title. If its not found, returns null
        const QUERY = `
            MATCH (p:Paper {title: $title})
            RETURN p
            LIMIT 1
            `
        const session = driver.session()
        let nodePaper;
        try {
            const result = await session.run(QUERY,{title:title})
            const node = result.records[0]?.get('p').properties
            if (node) nodePaper = NeoAccessor.convertToPaper(node)
        } catch (error) {
            console.error(`Issue getting paper with title ${title}`, error)
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

    public static async getReferences(title: string) : Promise<Paper[]> {
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
        } finally {
            session.close()
            return referencedPapers
        }
    }

    public static async getReferencing(title: string) : Promise<Paper[]> {
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
        const session = driver.session()
        // just make paper with given name.
        const QUERY = `MERGE (p:${this.generatePaperQuery(paper)})\nRETURN p`
        console.log("References count: ", references.length)

        try {
            const res = await session.run(
                QUERY,paper
            )
            const paperID: number = res.records[0]?.get("p").identity
            session.close()
            await Promise.allSettled(references.map(r => this.pushReference(paperID,r)))
        } catch (error) {
            console.error("Error merging papers: ", error)
            session.close()
        } 
    }
    private static async pushReference(paperid: Number, reference: Paper): Promise<void> {
        
        const session = driver.session() // sessions are not thread-aware
        try {
            const QUERY = `
            MATCH (p)
            where id(p) = $paperId
            MERGE (p)-[:REFERENCED]->(:${this.generatePaperQuery(reference)})
            `
            const res = await session.run(
                QUERY,
                {paperId: paperid, ...reference}
            )
        } catch (error) {
            console.error("Issue pushing References paper", error)
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
