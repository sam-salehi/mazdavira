import * as tf from '@tensorflow/tfjs-node';  // Change to tfjs-node
import use from '@tensorflow-models/universal-sentence-encoder';  // Universal Sentence Encoder

type Token = any

// Initialize the backend
async function initializeTF() {
    await tf.ready();  // No need to set backend explicitly with tfjs-node
}

export default class Tokenizer {

    static readonly word_count = 256;

    static async generateEmbedding(text: string): Promise<Token> {
        await initializeTF(); 
        const chunks = this.generateChunks(text)
        console.log(chunks.length)
        const embedding = await this.getAverageEmbedding(chunks)
        console.log(embedding)
        return embedding
    }

    private static generateChunks(text:string) : string[] {
        // splits text upto chunks of 256 words
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
        const model = await use.load()
        const embeddings = await model.embed(texts);
        const embeddingArray = embeddings.arraySync(); 
        const tensor = tf.tensor(embeddingArray)
        return tensor.mean(0).array()
    }
}

