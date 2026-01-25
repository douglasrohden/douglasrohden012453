import { Button, DarkThemeToggle } from "flowbite-react";
import { useAuth } from "../contexts/AuthContext";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onToggleSidebar: () => void;
}

export function PageHeader({
  title,
  subtitle,
  onToggleSidebar,
}: PageHeaderProps) {
  const { logout } = useAuth();

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 md:px-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <Button
          onClick={onToggleSidebar}
          color="light"
          size="sm"
          className="mr-2 p-2 md:hidden"
        >
          <span className="sr-only">Abrir menu</span>
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            ></path>
          </svg>
        </Button>
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
        <Button color="light" size="sm" onClick={() => logout()}>
          Sair
        </Button>
      </div>
    </nav>
  );
}
