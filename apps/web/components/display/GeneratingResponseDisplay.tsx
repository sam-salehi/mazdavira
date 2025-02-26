import { Skeleton } from "../ui/skeleton"

export default function GeneratingResponseDisplay() { //FIXME: skeleton is ugly

    return <div className="flex flex-col space-y-4">
        <Skeleton className="h-[25px] w-1/6"></Skeleton>
      <Skeleton className="h-[125px] w-full rounded-xl" />
      </div>
}



