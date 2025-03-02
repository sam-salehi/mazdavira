import { chosenPaper } from "@/app/page";
import PaperCard from "../display/PaperCardDisplay";
function Navbar({
  chosenPapers,
  selectedPaper,
  onSelectPaper,
  setChosenPapers,
}: {
  chosenPapers: chosenPaper[];
  selectedPaper: string;
  onSelectPaper: (s: string) => void;
  setChosenPapers: (papers: chosenPaper[]) => void;
}) {
  return (
    <div className="h-[90%] overflow-y-scroll hide-scrollbar">
      {chosenPapers.map((paper) => (
        <PaperCard
          key={paper.arxiv}
          id={paper.arxiv}
          title={paper.title}
          authors={paper.authors}
          year={paper.year}
          link={paper.link}
          selected={selectedPaper === paper.arxiv}
          onClick={() => onSelectPaper(paper.arxiv)}
          onClose={() =>
            setChosenPapers(
              chosenPapers.length > 1
                ? chosenPapers.filter((p) => p.arxiv !== paper.arxiv)
                : [],
            )
          }
        />
      ))}
    </div>
  );
}
export default Navbar;
