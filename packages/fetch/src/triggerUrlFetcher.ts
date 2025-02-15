import axios from "axios"
import { parseStringPromise } from 'xml2js';
import { fetchPaperPDFLink } from "./urlFetcher";

import { task,tasks } from "@trigger.dev/sdk/v3";



export const fetchPaperURL = task({
    id: "fetch-paper-url",
    run: fetchPaperPDFLink
})


