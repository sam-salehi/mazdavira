import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { number, z } from 'zod';

export const apiKey: string = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyBRfwiNmkhOlwcX94E5eQ96xMLF5asdH8s";

export const geminiModel = createGoogleGenerativeAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    apiKey: apiKey
});

export type reference = {title:string, authors: string[], pub_year: number, arxiv?:string, doi?:string}
export type paperInfo = reference & {institutions:string[], referencing_count:number, references: reference[]}

export const INFORMATION_EXTRACTION_SCHEMA = z.object({ 
    title: z.string(),
    authors: z.array(z.string()),
    pub_year: z.number(),
    referencing_count:z.number(),
    arxiv: z.string().optional(),
    doi:z.string().optional(),
    institutions: z.array(z.string()),
    references: z.array(z.object({
        title: z.string(),
        author: z.array(z.string()),
        pubYear: z.number(),
        arxiv: z.string().optional(),
        doi:z.string().optional(),
    }))
})


