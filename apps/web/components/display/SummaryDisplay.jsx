import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { X } from "lucide-react";
import { createPortal } from "react-dom";

export default function SummaryDisplay({ summary, onCloseSummary }) {
  //TODO: fix summary display

  return createPortal(
    <Card className="fixed top-1/2 h-1/3 w-1/2 max-w-8 overflow-scroll bg-white p-4 overflow-hide ">
      <X onClick={onCloseSummary}></X>
      <CardContent>{summary}</CardContent>
    </Card>,
    document.body,
  );
}
