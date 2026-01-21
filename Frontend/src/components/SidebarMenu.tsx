import { Sidebar, SidebarItem, SidebarItems, SidebarItemGroup } from "flowbite-react";
import { HiCollection, HiMusicNote, HiUser } from "react-icons/hi";
import { useLocation } from "react-router-dom";

export function SidebarMenu() {
    let pathname = '';
    try {
        const location = useLocation();
        pathname = location.pathname;
    } catch (e) {
        // Not inside a Router, keep pathname empty
    }
    const isActive = (path: string) => pathname === path;
    return (
        <div className="h-full min-h-screen w-64 border-r border-gray-300 dark:border-gray-700">
            <Sidebar aria-label="Main Sidebar Navigation" className="w-full">
                <div className="mb-5 flex items-center pl-2.5">
                    <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Music Player Free</span>
                </div>
                <SidebarItems>
                    <SidebarItemGroup>
                        <SidebarItem
                            href="/artista"
                            icon={HiUser}
                            className={`hover:bg-gray-200 dark:hover:bg-gray-600 ${isActive('/artista') ? 'bg-gray-300 dark:bg-gray-700 font-semibold' : ''}`}
                        >
                            Artistas
                        </SidebarItem>
                        <SidebarItem
                            href="/albuns"
                            icon={HiCollection}
                            className={`hover:bg-gray-200 dark:hover:bg-gray-600 ${isActive('/albuns') ? 'bg-gray-300 dark:bg-gray-700 font-semibold' : ''}`}
                        >
                            Álbuns
                        </SidebarItem>
                        <SidebarItem
                            href="#"
                            icon={HiMusicNote}
                            className="hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Playlists
                        </SidebarItem>
                    </SidebarItemGroup>
                </SidebarItems>
            </Sidebar>
        </div>
    );
}
