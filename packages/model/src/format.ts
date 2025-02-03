
export default class PaperInfoFormatter {
    // used to monitor format of inputs being passed around

    public static formatArxivID(arxivID: string | undefined): string | undefined {
        if (!arxivID) return undefined
        if (arxivID.length === 10) return arxivID
        return PaperInfoFormatter.extractArxivId(arxivID)

    }


    private static extractArxivId(input: string): string | undefined { //TODO: test this at beginning of pipeline
        // Match patterns like: 1234.5678, arxiv:1234.5678, or https://arxiv.org/abs/1234.5678
        const pattern = /(\d{4}\.\d{4,5})/             
        const match = input.match(pattern);
        if (match && match[1]) {
            return match[1]
        }
    
        return undefined;
    }
    
}