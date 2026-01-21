import { Sidebar, SidebarItem, SidebarItems, SidebarItemGroup } from "flowbite-react";
import { HiCollection, HiMusicNote, HiUser } from "react-icons/hi";
import { useLocation, useNavigate } from "react-router-dom";

export function SidebarMenu() {
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
    const activeClass = "bg-gray-300 dark:bg-gray-700 font-semibold";

    const handleNavigate = (path: string) => {
        const alreadyHere = isActive(path);
        if (alreadyHere) {
            navigate(path, { replace: true, state: { refreshAt: Date.now() } });
            return;
        }
        navigate(path);
    };
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
                            active={isActive("/artista")}
                            onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                                e.preventDefault();
                                handleNavigate("/artista");
                            }}
                            className={`hover:bg-gray-200 dark:hover:bg-gray-600 ${isActive("/artista") ? activeClass : ""}`}
                        >
                            Artistas
                        </SidebarItem>
                        <SidebarItem
                            href="/albuns"
                            icon={HiCollection}
                            active={isActive("/albuns")}
                            onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                                e.preventDefault();
                                handleNavigate("/albuns");
                            }}
                            className={`hover:bg-gray-200 dark:hover:bg-gray-600 ${isActive("/albuns") ? activeClass : ""}`}
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
