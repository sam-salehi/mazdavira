import { useGraphDataContext } from "../../app/src/GraphDataContext";
import clsx from "clsx";
import { Button } from "../ui/button";
import { ReadyState } from "react-use-websocket";
import {Rotate3dIcon } from "lucide-react";
const BLUE = "rgb(0, 255, 255)";
const RED = "rgb(255, 0,0)"
const GREEN = "rgb(0, 255, 0)"

function ExtractionDisplay() {
    // Display of server-side extraction in callBFS on screen
    const {fetchingNodesCount,socketStatus,canUpdate, fetchAllNewData} = useGraphDataContext();
    return (
        <div className={clsx("absolute z-20 left-0 top-0 h-fit w-fit mt-5 ml-5", {
            "animated-border": fetchingNodesCount !== 0})}>
            <div className="relative p-7 bg-black">  {/* Inner content */}
                <Button className="bg-transparent" disabled={!canUpdate} onClick={fetchAllNewData}>
                    <Rotate3dIcon className="text-[rgb(0,255,255)]"/>
                </Button>
                <Header color={BLUE}>Extraction count: {fetchingNodesCount}</Header>
                <SocketStatusDisplay status={socketStatus}/>
            </div>
        </div>
    );
}

function SocketStatusDisplay({status}:{status:ReadyState}) {
    if (status === 0) { 
        return <Header color={BLUE} >Establishing Connection</Header>
    }
    if (status === 1) {
        return <Header color={GREEN} >Connection Established</Header>        
    }
    return <Header color= {RED} >Connection Closed</Header>

}





const Header = ({color,children}:{color:string,children: React.ReactNode}) => <h1 className="opacity-60" style={{ color }}>{children}</h1>
export default ExtractionDisplay;

