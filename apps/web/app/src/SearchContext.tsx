import React, { createContext, useContext, useState, ReactNode } from "react";


type SearchResult = {
    // what gets fetched form backend as result of serach
}


interface SearchContextType {
    searchInput: string,
    setSearchInput:  React.Dispatch<React.SetStateAction<string>>
    searchResults: SearchResult[]
    setSearchResults: React.Dispatch<React.SetStateAction<SearchResult[]>>
    submitSearch: () => void
}

const SearchContext = createContext<SearchContextType |undefined>(undefined)



export const SearchContextProvider: React.FC<{children:ReactNode}> = ({children}) => {

    const [searchInput, setSearchInput] = useState<string>("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);


    // searches db for searchInput as title
    // adds found results into searchResults.
    function submitSearch() {
        
    }



    const value = {
        searchInput,
        setSearchInput,
        searchResults,
        setSearchResults,
        submitSearch
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