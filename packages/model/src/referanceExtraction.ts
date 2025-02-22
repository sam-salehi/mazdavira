import { generateObject,generateText, streamText } from "ai";
import { geminiModel } from "./config.js";
import { EXTRACTING_REFERENCES_PROMPT, CONNECTION_GENERATION_PROMPT_WO_QUESTION,CONNECTION_GENERATION_PROMPT_W_QUESTION,SUMMARY_GENERATION_PROMPT,QUESTION_ON_PAPER_PROMPT} from "./prompt.js";
import { type reference, type paperInfo, INFORMATION_EXTRACTION_SCHEMA } from "./config.js";
import PaperInfoFormatter from "./format.js"

const GEMINI_MODEL_NAME = "gemini-2.0-flash-exp"

// Helper function to map references
function mapReferences(refs: any[]): reference[] {
    return refs.map(ref => ({
        title: ref.title,
        authors: ref.author,
        pub_year: ref.pubYear,
        arxiv: PaperInfoFormatter.formatArxivID(ref.arxiv),
        doi: ref.doi
    }));
}
// Main function to extract information
export async function extractInformation(paper: string): Promise<paperInfo> {
    const generatedPrompt = EXTRACTING_REFERENCES_PROMPT.replace("{paper}", paper);
    const { object } = await generateObject({
        model: geminiModel(GEMINI_MODEL_NAME),
        schema: INFORMATION_EXTRACTION_SCHEMA,
        prompt: generatedPrompt
    });

    // Construct the paperInfo object
    const paperInfoObject: paperInfo = {
        title: object.title,
        authors: object.authors,
        pub_year: object.pub_year,
        referencing_count: object.referencing_count,
        institutions: object.institutions,
        references: mapReferences(object.references),
        arxiv: PaperInfoFormatter.formatArxivID(object.arxiv),
        doi: object.doi
    };

    return paperInfoObject; // Return the constructed object
}



export async function generateConnectionDetails(referencingPaper: string, referencedPaper: string, userQuestion: string): Promise<string> {

    let generatedPrompt: string;

    if (userQuestion) {
        generatedPrompt = CONNECTION_GENERATION_PROMPT_W_QUESTION.replace("{referencing_paper}",referencingPaper).replace("referenced_paper",referencedPaper)
    } else {
        generatedPrompt = CONNECTION_GENERATION_PROMPT_WO_QUESTION.replace("{referencing_paper}",referencingPaper).replace("referenced_paper",referencedPaper).replace("{question}",userQuestion)
    }

    const {text} = await generateText({
        model: geminiModel(GEMINI_MODEL_NAME),
        prompt: generatedPrompt
    });
    return text
}


export function generateSummary(paper: string) {
    const prompt: string = SUMMARY_GENERATION_PROMPT.replace("{paper}",paper)

    const result = streamText({
        system: 'You are a helpful assistant. Respond to the user in Markdown format.',
        model: geminiModel(GEMINI_MODEL_NAME),
        prompt: prompt
    })
    return result
}


export function generateQuestionResponse(question:string,paper:string) {
    const prompt: string = QUESTION_ON_PAPER_PROMPT.replace("{question}",question).replace("{paper}",paper);

    const result =  streamText({   
         system:'You are a helpful assistant. Respond to the user in Markdown format.',
        model: geminiModel(GEMINI_MODEL_NAME),
        prompt: prompt
    })
    return result
}
