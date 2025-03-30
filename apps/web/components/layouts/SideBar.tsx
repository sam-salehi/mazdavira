import { Button } from "@/components/ui/button";
import ChatLayout from "./Chat";
import Navbar from "./Navbar";
import { chosenPaper } from "@/app/page";
import { SearchInput } from "./SearchBar";
import SearchSideBar from "./SearchBar";
import { SearchContextProvider } from "@/app/src/SearchContext";
import { useSideBarContext } from "@/app/src/SideBarContext";

// Features.generateSummary("ww.google.com")

export function Sidebar({
  selectedPaper,
  onSelectPaper,
  onClose,
  chosenPapers,
  setChosenPapers,
}: {
  selectedPaper: string;
  onSelectPaper: (s: string) => void;
  onClose: () => void;
  chosenPapers: chosenPaper[];
  setChosenPapers: (papers: chosenPaper[]) => void;
}) {
  const {sidebarTab,openChat,openNavigation,openSearch} = useSideBarContext()

  return (
    <div className="bg-black fixed border-l border-gray-500 right-0 top-0 h-full w-1/4 p-7">
      <div className="flex justify-between mb-8">
        <Button variant={"secondary"} onClick={onClose}>
          Close
        </Button>
        {sidebarTab === "nav" ? (
          <Button variant={"secondary"} onClick={openChat}>
            Chat
          </Button>
        ) : (
          <Button variant={"secondary"} onClick={openNavigation}>
            Navigate
          </Button>
        )}
      </div>
      <SearchContextProvider>
        {(sidebarTab === "search" || sidebarTab === "nav") && <SearchInput onClick={openSearch} />}

        {sidebarTab === "nav" ? (
          <Navbar
            chosenPapers={chosenPapers}
            selectedPaper={selectedPaper}
            onSelectPaper={onSelectPaper}
            setChosenPapers={setChosenPapers}
          ></Navbar>
        ) : 
        sidebarTab=== "chat" ? 
        <ChatLayout></ChatLayout> : 
        <SearchSideBar
          chosenPapers={chosenPapers}
          setChosenPapers={setChosenPapers}
          ></SearchSideBar>
        }
      </SearchContextProvider>
    </div>
  );
}


