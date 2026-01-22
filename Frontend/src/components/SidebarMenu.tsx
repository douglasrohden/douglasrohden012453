import { Sidebar, SidebarItem, SidebarItems, SidebarItemGroup, Button } from "flowbite-react";
import { HiCollection, HiMusicNote, HiUser } from "react-icons/hi";
import { useLocation, useNavigate } from "react-router-dom";

interface SidebarMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
    const activeClass = "bg-gray-300 dark:bg-gray-700 font-semibold";

    const handleNavigate = (path: string) => {
        const alreadyHere = isActive(path);
        if (alreadyHere) {
            navigate(path, { replace: true, state: { refreshAt: Date.now() } });
        } else {
            navigate(path);
        }
        onClose(); // Close sidebar on mobile after navigation
    };
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-30 bg-gray-900/50 md:hidden"
                />
            )}

            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-300 bg-white transition-transform duration-300 dark:border-gray-700 dark:bg-gray-800 md:static md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <Sidebar aria-label="Main Sidebar Navigation" className="w-full">
                    <div className="mb-5 flex items-center justify-between pl-2.5 pr-2">
                        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Music Player Free</span>
                        {/* Close button for mobile */}
                        <Button
                            onClick={onClose}
                            color="light"
                            size="sm"
                            className="ml-auto p-2 md:hidden"
                        >
                            <span className="sr-only">Fechar sidebar</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                        </Button>
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
        </>
    );
}
