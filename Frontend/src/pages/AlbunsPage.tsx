
import { Button, DarkThemeToggle } from "flowbite-react";
import { useAuthFacade } from "../hooks/useAuthFacade";
import { SidebarMenu } from "../components/SidebarMenu";
import AlbunsList from "../components/AlbunsList";

export default function AlbunsPage() {
    const { user, logout } = useAuthFacade();

    return (
        <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <SidebarMenu />

            <div className="flex-1 flex flex-col">
                {/* Header Area */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Álbuns
                    </h1>
                    <div className="flex gap-2">
                        <DarkThemeToggle />
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mr-4">
                            {user}
                        </div>
                        <Button color="light" size="sm" onClick={logout}>
                            Sair
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
                    <AlbunsList />
                </div>
            </div>
        </main>
    );
}
