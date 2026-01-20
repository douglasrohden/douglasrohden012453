import { Sidebar, SidebarItem, SidebarItems, SidebarItemGroup } from "flowbite-react";

const HomeIcon = () => (
    <svg
        className="h-5 w-5 flex-shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
    >
        <path d="M19.707 9.293l-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
    </svg>
);

const UserIcon = () => (
    <svg
        className="h-5 w-5 flex-shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
    >
        <path
            fillRule="evenodd"
            d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 1 1 14 0H3Z"
            clipRule="evenodd"
        />
    </svg>
);

const InboxIcon = () => (
    <svg
        className="h-5 w-5 flex-shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
    >
        <path d="m17.418 3.623-.018-.008a6.713 6.713 0 0 0-2.4-.569V2h1a1 1 0 1 0 0-2h-2a1 1 0 0 1-1 1v2H9.89A6.977 6.977 0 0 1 12 8v5h-2V8A5 5 0 1 0 0 8v6a1 1 0 0 0 1 1h8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h6a1 1 0 0 0 1-1V8a5 5 0 0 0-2.582-4.377ZM6 12H4a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2Z" />
    </svg>
);

const ShoppingBagIcon = () => (
    <svg
        className="h-5 w-5 flex-shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
    >
        <path
            fillRule="evenodd"
            d="M10 2a4 4 0 0 0-4 4v1H5a1 1 0 0 0-.994.89l-1 9A1 1 0 0 0 4 18h12a1 1 0 0 0 1-1.11l-1-9A1 1 0 0 0 15 7h-1V6a4 4 0 0 0-4-4Zm2 5V6a2 2 0 1 0-4 0v1h4Zm-6 3a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm7-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
            clipRule="evenodd"
        />
    </svg>
);

export function SidebarMenu() {
    return (
        <div className="h-full min-h-screen w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <Sidebar aria-label="Sidebar with multi-level dropdown example">
                <SidebarItems>
                    <SidebarItemGroup>
                        <SidebarItem href="/artista" icon={UserIcon}>
                            Artistas
                        </SidebarItem>
                        <SidebarItem href="/albuns" icon={InboxIcon}>
                            Álbuns
                        </SidebarItem>
                        <SidebarItem href="#" icon={ShoppingBagIcon}>
                            Playlists
                        </SidebarItem>
                    </SidebarItemGroup>
                </SidebarItems>
            </Sidebar>
        </div>
    );
}
