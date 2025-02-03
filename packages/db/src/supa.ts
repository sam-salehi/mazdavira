import Supabase from "./config.js" // Ensure you import the Supabase client
import { Paper } from "./convert.js"


// type format used to insert into supabase paper table.
export default class PaperTableAccessor {


    public static async insertPaper(paper: Paper) {

        const paperID: string | null = await this.findPaper(paper)
        console.log(paperID)
        if (!paperID) {
            console.log("Pushing paper")
            this.pushPaper(paper)
        } else {
            console.log("Not pushing paper")
            this.updatePaper(paper,paperID)
        }
    }

    private static async findPaper(paper: Paper): Promise<string | null> { //TODO: whats up with this
        // check to see if paper is already a row in the database
        // currently only uses arxiv id. Will use DOI and title later. 
        if (!paper) return null

        const { data, error } = await Supabase
            .from('paper') // Replace 'papers' with your actual table name
            .select('id') // Assuming 'id' is a unique identifier for papers
            .eq('arxiv', paper.arxiv) 
            .single();

        // if (error) {
        //     console.error("Issue finding Paper",error)
        //     throw error
        // }

        if (data) return data.id
        return null
    }

    private static async getPaperFromDOI(doi: string): Promise<Paper | null> {
        const { data, error } = await Supabase
            .from('paper') // Replace 'papers' with your actual table name
            .select('*')
            .eq('doi', doi)
            .single();

        if (error) {
            console.error("Issue accessing database: ", error)
            return null
        }
        return data || null; // Returns the paper data or null if not found
    }

    private static async getPaperFromArxivID(ArxivID: string): Promise<Paper | null> {
        const { data, error } = await Supabase
            .from('paper') // Replace 'papers' with your actual table name
            .select('*')
            .eq('arxiv', ArxivID) // Assuming 'arxiv_id' is a field in your Paper object
            .single();
        
        if (error) {
            console.error("Issue accessing database: ", error)
            return null
        }


        return data || null; // Returns the paper data or null if not found
    }

    private static async pushPaper(paper: Paper): Promise<void> {
        // REQUIRES paper to not have any of its entries already in the db
        const { data, error } = await Supabase
            .from('paper') // Replace 'papers' with your actual table name
            .insert([paper]); // Insert the paper object
        if (error) {
            throw new Error(`Error inserting paper: ${error.message}`);
        }
    }

    private static async updatePaper(paper: Paper, paperID: string): Promise<void> {
        // REQUIRES paper to already exist in the table at identifier paperID. We are completely replacing the row with new data for now
        const {data,error} = await Supabase
            .from("paper")
            .update(paper)
            .eq("id",paperID)

        if (error) {
            console.error(`Issue updating paper table row at id ${paperID}`)
            throw error
        }
    }
}