


export const EXTRACTING_REFERENCES_PROMPT = `You will be given a research paper and be asked to extract the information setout below:
title: the title of the paper
authors: a list of authors of the paper
pubYear: the year the paper was published
arxiv: papers arxiv number if one exists e.g 2301.12345. Dont add arxiv
doi: papers doi if mentioned. Don't write null
intitutions: which institutions the writers of the paper are from. i.e. institutions and companies. Just give the name of the instituion
refCount: number of references made by the paper
refrences: a list of objects, where each object is made some of the definitions mentioned. These objects require title, author,pubyear, arxiv and doi.

<paper>
{paper}
</paper>

`





const CONNECTION_GENERATION_PROMPT = `Look for the relevant citation inside the text but don't mention these excplicitly. State how they are used to push the author's arguments. Don't be afraid of being technical and make sure you are curtain of the response. 
<referenceing_paper> 
{referencing_paper}
<referencing_paper>

<referenced_paper>
{referenced_paper}
<referenced_paper>
`


export const CONNECTION_GENERATION_PROMPT_WO_QUESTION = `You will be given two research papers with one referencing the other.` + CONNECTION_GENERATION_PROMPT
export const CONNECTION_GENERATION_PROMPT_W_QUESTION = 
    `You will be given two research papers with one referencing the other and a question which you should respond to about the papers.` 
    + CONNECTION_GENERATION_PROMPT 
    + `<question>{question}<question>`
