import React, { createContext, ReactNode, useContext, useState } from 'react';

interface SidebarContextType {
    isOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(prev => !prev);
    const closeSidebar = () => setIsOpen(false);
    const openSidebar = () => setIsOpen(true);

    return (
        <SidebarContext.Provider value={{ isOpen, toggleSidebar, closeSidebar, openSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};
