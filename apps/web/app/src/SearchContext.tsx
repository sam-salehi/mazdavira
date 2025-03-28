import React, { createContext, useContext, useState, ReactNode } from "react";
import { chosenPaper } from "../page";
import NeoAccessor from "@repo/db/neo";



type SearchResult = chosenPaper


interface SearchContextType {
    searchInput: string,
    setSearchInput:  React.Dispatch<React.SetStateAction<string>>
    searchResults: SearchResult[]
    setSearchResults: React.Dispatch<React.SetStateAction<SearchResult[]>>
    submitSearch: () => Promise<void>
}

const SearchContext = createContext<SearchContextType |undefined>(undefined)



export const SearchContextProvider: React.FC<{children:ReactNode}> = ({children}) => {

    const [searchInput, setSearchInput] = useState<string>("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);



    // searches db for searchInput as title
    // adds found results into searchResults.
    async function submitSearch() {
        if (!searchInput) return
        const nodes = await NeoAccessor.getPapersByTitle(searchInput) 
        const results: SearchResult[] = nodes.map(node => ({
            title: node.title,
            year: node.pub_year,
            authors: node.authors,
            arxiv: node.arxiv,
            link: node.pdf_link || ""
        }));
        setSearchResults(results)
    }

    const value = {
        searchInput,
        setSearchInput,
        searchResults,
        setSearchResults,
        submitSearch,
    }

    return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}


export const useSearchContext = () => {
    const context = useContext(SearchContext)
    if (!context) {
        throw new Error("useSearchContext must be used within a SearchContext provider")
    }
    return context
}