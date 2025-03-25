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

  const referenceCount: number = await ArxivAPI.getReferencedCount(arxiv)
  return referenceCount
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

  // public static async getReferencedCount(arxivID: string): Promise<number> {
  //   try {
  //       const title = await this.fetchArxivTitle(arxivID);
  //       const citations = await this.fetchCitationsFromScholar(title);
  //       return citations;
  //   } catch (error) {
  //       console.error(`Error fetching referenced count for ${arxivID}:`, error);
  //       throw error;
  //   }
  // }


    public static async getReferencedCount(arxivID:string): Promise<number> {

    // try {
    //   const response = await axios.get("https://opencitations.net/index/api/v1/citations/10.48550/arXiv.2301.00001",
    //     {headers:{"authorization":"39da254f-2609-4125-8aa5-c522558622c4 "}} // FIXME: move to env
    //   )
    //   console.log(Object.keys(response))
    //   console.log(response.data.length)
    //   console.log(response.data[0])
    //   return 0
    // } catch (error) {
    //   console.error("Issue fetching referecnes Count from openCitations")
    //   throw error
    // }
    return 0
    }


  private static async fetchArxivTitle(arxivID: string): Promise<string> {
    const arxivResponse = await axios.get(`http://export.arxiv.org/api/query?id_list=${arxivID}`);
    const title = arxivResponse.data.match(/<title>(.*?)<\/title>/)?.[1]?.trim();
    // if (!title) {
    //     throw new Error(`Could not find paper title for arxivID: ${arxivID}`);
    // }
    console.log("Found title: ", title);
    return title;
  }

  private static async fetchCitationsFromScholar(title: string): Promise<number> {
    const encodedTitle = encodeURIComponent(title);
    const scholarUrl = `https://scholar.google.com/scholar?q=${encodedTitle}`;

    // Add delay to avoid aggressive scraping
    try {
      const proxyResponse = await axios.get(scholarUrl, {
          proxy: { 
              protocol: "http",
              host: "superproxy.zenrows.com",
              port: parseInt("1337" || ''),
              auth: {
                  username: "3ZFxJsdY3NLb",
                  password: "kwiMYIQeErGi"
              }
          },
          headers: {
              'User-Agent': this.getRandomUserAgent(),
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Connection': 'keep-alive'
          },
          timeout: 10000
      });


        const $ = cheerio.load(proxyResponse.data);
        const citationText = $('.gs_ri .gs_fl').first().text();
        const citationMatch = citationText.match(/Cited by (\d+)/);
        return citationMatch?.length ? parseInt(citationMatch[1] || '0') : 0;
    } catch (error) {
        console.error('Error fetching citations:', error);
        return 0
    }
  }

  private static getRandomUserAgent(): string {
    const userAgents: string[] = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)] || "";
  }

  private static parseArxiv(arxivID: string): string {
    // Remove 'arxiv:', 'arXiv:', and 'https://arxiv.org/abs/' prefixes
    const cleaned = arxivID.replace(/^(arxiv:|arXiv:|https:\/\/arxiv\.org\/abs\/)/i, '');
    
    // Remove version suffix (e.g., 'v1', 'v2')
    const withoutVersion = cleaned.replace(/v\d+$/, '');
    
    // Trim any whitespace
    return withoutVersion.trim();
  }
}
//   public static async getReferencedCount(arxiv: string): Promise<number> {
//     const CROSSREF_API = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxiv}?fields=citationCount`;
//     try {
//         const response = await axios.get(CROSSREF_API);
//         return response.data. citationCount
//     } catch (error) {
//         console.error(`Error fetching referencing count for ArXiv ID ${arxiv}:`, error);
//         return 0;
//     }
//   }
// }


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
