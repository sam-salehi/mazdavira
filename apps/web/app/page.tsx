'use client'
import { useState } from 'react';

import ForceGraph from './src/ForceGraph';
import {Sidebar, SidebarButton} from './src/SideBar';


export default function Home() {

  const [sideBarOpen,setSideBarOpen] = useState<boolean>(true)

  return <div className='bg-black h-full'>
    {/* <span className='text-4xl text-red-500'> This is some text</span> */}
    <ForceGraph />
    {sideBarOpen ? <Sidebar onClose={() => setSideBarOpen(false)}/> : <SidebarButton onClick={() => setSideBarOpen(true)}/>}
  </div>
}





