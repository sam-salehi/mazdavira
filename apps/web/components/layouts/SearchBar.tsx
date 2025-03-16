import { Input } from "../ui/input"
import { Search } from 'lucide-react';
import { useSearchContext } from "@/app/src/SearchContext";
import { chosenPaper, makeChosenPaper } from "@/app/page";
import {PartialPaperCard} from "../display/PaperCardDisplay";
import NeoAccessor from "@repo/db/neo";
import { useSideBarContext } from "@/app/src/SideBarContext";


export function SearchInput({ onClick }:{onClick:()=>void}) {

    const {searchInput,setSearchInput,submitSearch} = useSearchContext();
    const {openNavigation,openSearch} = useSideBarContext()



    const handleSubmission = () => {
        if (!searchInput) {
            openNavigation() // open navigaton on empty search submit
            return
        }
        submitSearch()
    }
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {openSearch();setSearchInput(event.target.value);}
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") handleSubmission()
    }

    return (
        <div className="flex items-center mb-8" onClick={onClick}>
            <Search className="text-gray-500 mr-2 cursor-pointer" onClick={handleSubmission}/>
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
        if (addedPaper) setChosenPapers((chosenPapers:chosenPaper[]) => [...chosenPapers,makeChosenPaper(addedPaper)])
    }

    return <div className=" h-[90%] overflow-y-scroll hide-scrollbar">
        {searchResults.map((paper)=>(
            <PartialPaperCard
                key={paper.arxiv}
                title={paper.title}
                authors={paper.authors}
                year={paper.year}
                handleAddBtn={()=>addChosenPaper(paper.arxiv)}
                isAdded = {!!chosenPapers.find(cp => cp.arxiv===paper.arxiv)}
            />
        ))}
    </div>
}

export default SearchSideBar



