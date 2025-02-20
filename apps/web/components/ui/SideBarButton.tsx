import { Button } from "./button"
import { PanelRightOpen } from "lucide-react"

export default function SidebarButton({onClick}:{onClick: ()=>void}) {

    return <Button className="bg-white fixed right-0 top-1/2 transform -translate-y-1/2 h-52 w-2" variant="outline" onClick={onClick}>

         <PanelRightOpen className=""/>
    </Button>
}