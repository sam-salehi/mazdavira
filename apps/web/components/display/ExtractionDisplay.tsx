import { useGraphDataContext, type SocketStatus } from "../../app/src/GraphDataContext";

const BLUE = "rgb(0, 255, 255)";
const RED = "rgb(255, 0,0)"
const GREEN = "rgb(0, 255, 0)"

function ExtractionDisplay() {
    // Display of server-side extraction in callBFS on screen
    const {fetchingNodesCount,socketStatus} = useGraphDataContext();

    const hiddenNodes = 4
    // TODO add display nodes button.

    return (
        <div className="bg-gray absolute z-20 left-0 top-0 h-fit w-1/4 p-7">
            <Header color={BLUE}>Extraction count: {fetchingNodesCount}</Header>
            <Header color={BLUE}>Hidden nodes: {hiddenNodes}</Header>
            <SocketStatusDisplay status={socketStatus}/>
        </div>
    );
}

function SocketStatusDisplay({status}:{status:SocketStatus}) {
    if (status === "closed") {
        return <Header color= {RED} >Connection Closed</Header>
    }
    if (status === "connected") {
        return <Header color={BLUE} >Establishing Connection</Header>
    }
    return <Header color={GREEN} >Connection Established</Header>
}

const Header = ({color,children}:{color:string,children: React.ReactNode}) => <h1 className="opacity-60" style={{ color }}>{children}</h1>
export default ExtractionDisplay;