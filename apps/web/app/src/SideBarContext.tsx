import React, { createContext, useContext, useState, ReactNode } from "react";

const SideBarContext = createContext<SideBarMethods | undefined>(undefined); 

type SidebarTabType = "nav"|"chat" | "search"

interface SideBarMethods {
    sidebarTab: SidebarTabType
  openNavigation: () => void;
  openChat: () => void;
  openSearch: () => void,
}
export const useSideBarContext = () => {
  const context = useContext(SideBarContext);
  if (!context) {
    throw new Error("SideBarContext must be used within appropriate provider");
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {


    const [sidebarTab, setSidebarTab] = useState<SidebarTabType>("nav");


    const openNavigation = () => setSidebarTab("nav");
    const openChat = () => setSidebarTab("chat");
    const openSearch = () => setSidebarTab("search");

    const value = {
    sidebarTab,
    openNavigation,
    openChat,
    openSearch
    }
 
    return  <SideBarContext.Provider value={value}>{children}</SideBarContext.Provider>
  }