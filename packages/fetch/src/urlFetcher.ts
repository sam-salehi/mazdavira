import { experimental_createProviderRegistry } from "ai";
import * as cheerio from "cheerio"
import axios from "axios"
import { parseStringPromise } from 'xml2js';
import dotenv from 'dotenv';
import https from 'https';
dotenv.config({path: ""});




export async function fetchPaperPDFLink(arxiv: string): Promise<string|null>{
  return ArxivAPI.fetchPaper(arxiv)
}


export async function  getReferencedCount(arxiv:string): Promise<number | null> {
  // TODO remove all dependancies
  return 0

}


export async function fetchArxivID(title:string) : Promise<string | null> {
  return ArxivAPI.fecthArxivID(title);
}

class ArxivAPI {  
  // Arxiv related API's
    public static async fetchPaper(arxivId: string): Promise<string | null> {
      // returns paper's pdf link
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


  
  public static async fecthArxivID(title: string): Promise<string | null> { 
      // URL encode the title for the query
      const query = `http://export.arxiv.org/api/query?search_query=ti:"${encodeURIComponent(title)}"&max_results=1`;

      try {
          // Send the request
          const response = await axios.get(query);
  
          // Parse the XML response
          const result = await parseStringPromise(response.data);
  
          // Navigate to the entry (if it exists)
          const entry = result.feed.entry?.[0];
          if (entry) {
              // Extract the arXiv ID from the <id> tag
              const arxivIdUrl = entry.id[0];
              const arxivId = arxivIdUrl.split('/').pop(); // Extract the ID portion
              const parsedID = ArxivAPI.parseArxiv(arxivId)
            console.log("Given title: ", title)
            console.log("Found arxiv ID: ",parsedID)

              return parsedID || null;
          } else {
              console.log("No matching paper found.");
              return null;
          }
      } catch (error) {
          console.error("Failed to fetch data:", error);
          return null;
      }
    }  



  private static parseArxiv(arxivID: string): string {
    const cleaned = arxivID.replace(/^(arxiv:|arXiv:|https:\/\/arxiv\.org\/abs\/)/i, '');
    const withoutVersion = cleaned.replace(/v\d+$/, '');
    return withoutVersion.trim();
  }
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
