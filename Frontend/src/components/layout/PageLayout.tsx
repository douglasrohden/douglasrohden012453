import { ReactNode, useState } from "react";
import { SidebarMenu } from "../SidebarMenu";
import { PageHeader } from "../PageHeader";
import { useAuthFacade } from "../../hooks/useAuthFacade";

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    const { user } = useAuthFacade();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col">
                <PageHeader
                    title={`Bem-vindo, ${user}!`}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
                    {children}
                </div>
            </div>
        </main>
    );
}
