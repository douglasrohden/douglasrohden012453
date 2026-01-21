import { Button, DarkThemeToggle } from "flowbite-react";
import { useAuthFacade } from "../hooks/useAuthFacade";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    onToggleSidebar: () => void;
}

export function PageHeader({ title, subtitle, onToggleSidebar }: PageHeaderProps) {
    const { logout } = useAuthFacade();

    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="mr-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 md:hidden"
                >
                    <span className="sr-only">Abrir menu</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                    </svg>
                </button>
                <span className="self-center text-xl font-bold whitespace-nowrap text-gray-900 dark:text-white">
                    {title}
                </span>
                {subtitle && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {subtitle}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">

                <DarkThemeToggle />
                <Button color="light" size="sm" onClick={logout}>
                    Sair
                </Button>
            </div>
        </nav>
    );
}
