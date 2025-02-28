import { Input } from "../ui/input"
import { Search } from 'lucide-react';
import { useSearchContext } from "@/app/src/SearchContext";
import { chosenPaper } from "@/app/page";
import {PartialPaperCard} from "../display/PaperCardDisplay";
import NeoAccessor from "@repo/db/neo";


export function SearchInput({ onClick }) {

    const {searchInput,setSearchInput,submitSearch} = useSearchContext();


    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value);
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") submitSearch()
    }

    return (
        <div className="flex items-center" onClick={onClick}>
            <Search className="text-gray-500 mr-2" />
            <Input
                type="text"
                placeholder="Enter Title"
                value={searchInput}
                className="flex-1 pl-2 pr-4 py-2 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                />
        </div>
    );
}

function SearchSideBar({chosenPapers,setChosenPapers}:{chosenPapers:chosenPaper[], setChosenPapers:(s:any)=>void}) {
    const {searchResults} = useSearchContext()

    async function  addChosenPaper(arxivID:string) {
        // catches paper with id from backend and passes appends it to chosenPapers
        const addedPaper = await NeoAccessor.getPaper(arxivID)
        if (addedPaper) setChosenPapers((chosenPapers:chosenPaper[]) => [...chosenPapers,{
            title:addedPaper.title,
            year:addedPaper.pub_year,
            authors:addedPaper.authors,
            link: addedPaper.pdf_link,
            arxiv: addedPaper.arxiv
        }])
    }

    return <div className="grid grid-cols-1 gap-4">
        {searchResults.map((paper)=>(
            <PartialPaperCard
                key={paper.arxiv}
                title={paper.title}
                authors={paper.authors}
                year={paper.year}
                handleAddBtn={()=>addChosenPaper(paper.arxiv)}
                isAdded = {!!chosenPapers.find(cp => cp.arxiv=paper.arxiv)}
            />
        ))}
    </div>
}

export default SearchSideBar



