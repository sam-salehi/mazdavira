import { experimental_createProviderRegistry } from "ai";
import axios from "axios"
import { parseStringPromise } from 'xml2js';



export async function fetchPaperPDFLink(arxiv: string|undefined): Promise<string|null>{
  // adapt to work with doi and title if arxiv is not available.
  if (arxiv) return ArxivAPI.fetchPaper(arxiv)
  return null
}


export async function  getReferencedCount(arxiv:string|undefined, doi:string|undefined,title:string): Promise<number | null> {
  if (arxiv) return ArxivAPI.getReferencedCount(arxiv)
    return null
}

class ArxivAPI {  
  // Arxiv related API's
    public static async fetchPaper(arxivId: string): Promise<string | null> {
      // returns paper pdf given ArxivId
      const ARXIV_API = `http://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`;
      try {
          const response = await axios.get<any>(ARXIV_API);
          const xml = await parseStringPromise(response.data)
          const linkObj: { $: { title: string; href: string } } | undefined = xml.feed.entry[0].link.find((i: { $: { title: string; href: string } }) => i.$.title === "pdf");
          const link = linkObj ? linkObj.$.href : null;
          return link
      } catch (error) {
          console.error(`Error fetching paper URL from ArXiv for ${arxivId}:`, error);
          return null
      }
  }

  public static async getReferencedCount(arxiv: string): Promise<number> {
    const CROSSREF_API = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxiv}?fields=citationCount`;
    try {
        const response = await axios.get(CROSSREF_API);
        return response.data. citationCount
    } catch (error) {
        console.error(`Error fetching referencing count for ArXiv ID ${arxiv}:`, error);
        return 0;
    }
  }
}


export class DOIApi {
  // DOI related API's

}

function extractArxivId(input: string): string | null {
    // Match patterns like: 1234.5678, arxiv:1234.5678, or https://arxiv.org/abs/1234.5678
    const patterns = [
        /(\d{4}\.\d{4,5})/,                     // Basic arXiv ID format
        /arxiv:(\d{4}\.\d{4,5})/i,              // arxiv:ID format
        /arxiv.org\/abs\/(\d{4}\.\d{4,5})/i,    // URL format
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

export { extractArxivId };
