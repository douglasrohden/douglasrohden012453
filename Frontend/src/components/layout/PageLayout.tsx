import { ReactNode } from "react";
import { SidebarMenu } from "../SidebarMenu";
import { PageHeader } from "../PageHeader";
import { useAuthFacade } from "../../hooks/useAuthFacade";

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    const { user } = useAuthFacade();

    return (
        <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <SidebarMenu />

            <div className="flex-1 flex flex-col">
                <PageHeader title={`Bem-vindo, ${user}!`} />

                <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
                    {children}
                </div>
            </div>
        </main>
    );
}
