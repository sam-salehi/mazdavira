import * as tf from '@tensorflow/tfjs-node';  // Change to tfjs-node
import use from '@tensorflow-models/universal-sentence-encoder';  // Universal Sentence Encoder
import {PaperExtractor} from "@repo/fetch/src/pdfExtractor.js";


type Token = number[]

// Initialize the backend
async function initializeTF() {
    await tf.ready();  // No need to set backend explicitly with tfjs-node
}


let model = await use.load()

export default class Tokenizer {

    static readonly word_count = 256;

    static async generateEmbedding(text: string): Promise<Token> {
        // makes single embedding vector for text
        await initializeTF(); 
        const chunks = this.generateChunks(text)
        const embedding = await this.getAverageEmbedding(chunks)
        return embedding
    }

    private static generateChunks(text:string) : string[] {
        // splits text upto chunks respecting token lengths for model
        const words = text.split(" ")
        const chunks = []
        let i = 0
        while (i < words.length - Tokenizer.word_count) {
            chunks.push(words.slice(i,i+Tokenizer.word_count).join(" "))
            i += Tokenizer.word_count
        }
        chunks.push(words.slice(i).join(" "))
        return chunks
    }

    private static async getAverageEmbedding(texts:string[]): Promise<Token> {
        // generates embedding for each text and takes average
        if (!model) model = await use.load()
        const embeddings = await model.embed(texts);
        const embeddingArray = embeddings.arraySync(); 
        const tensor = tf.tensor(embeddingArray)
        return tensor.mean(0).array()
    }
}

