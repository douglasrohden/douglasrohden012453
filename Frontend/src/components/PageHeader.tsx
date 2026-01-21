import { Button, DarkThemeToggle } from "flowbite-react";
import { useAuthFacade } from "../hooks/useAuthFacade";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
    const { user, logout } = useAuthFacade();

    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
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
