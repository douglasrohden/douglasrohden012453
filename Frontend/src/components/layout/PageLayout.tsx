import { ReactNode, useState } from "react";
import { SidebarMenu } from "../SidebarMenu";
import { PageHeader } from "../PageHeader";
import { useAuth } from "../../contexts/AuthContext";

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col">
                <PageHeader
                    title={`Bem-vindo, ${user ?? "usuário"}!`}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                <div className="p-4 overflow-y-auto h-[calc(100vh-73px)] md:p-6">
                    {children}
                </div>
            </div>
        </main>
    );
}
