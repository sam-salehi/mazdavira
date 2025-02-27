import { Input } from "../ui/input"
import { Search } from 'lucide-react';
import { useSearchContext } from "@/app/src/SearchContext";


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
                placeholder="Eneter Title"
                value={searchInput}
                className="flex-1 pl-2 pr-4 py-2 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                />
        </div>
    );
}

function SearchSideBar() {
    return <div></div>
}

export default SearchSideBar



