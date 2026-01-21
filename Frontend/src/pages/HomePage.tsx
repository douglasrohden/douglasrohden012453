import { Button, DarkThemeToggle, Pagination, Select, Spinner, TextInput } from "flowbite-react";
import { useAuthFacade } from "../hooks/useAuthFacade";
import { SidebarMenu } from "../components/SidebarMenu";
import { ArtistCard } from "../components/ArtistCard";
import CreateArtistForm from "../components/CreateArtistForm";
import { useEffect, useMemo, useState } from "react";
import { Artista, artistsService } from "../services/artistsService";
import { useNavigate } from "react-router-dom";
import { Page } from "../types/Page";



const SearchIcon = () => (
    <svg
        className="h-5 w-5 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 20"
    >
        <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
        />
    </svg>
);

export default function HomePage() {
    const { user, logout } = useAuthFacade();
    const navigate = useNavigate();
    const [artists, setArtists] = useState<Artista[]>([]);
    const [pageData, setPageData] = useState<Page<Artista> | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(12);
    const [dir, setDir] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchArtists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, page, size, dir]);

    const totalPages = useMemo(() => pageData?.totalPages ?? 0, [pageData]);

    const fetchArtists = async () => {
        setLoading(true);
        try {
            const data = await artistsService.getAll(page, size, debouncedSearch, "nome", dir);
            setArtists(data.content);
            setPageData(data);
        } catch (error) {
            console.error("Failed to fetch artists", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <SidebarMenu />

            <div className="flex-1 flex flex-col">
                {/* Header Area */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Bem-vindo, {user}!
                    </h1>
                    <div className="flex gap-2">
                        <DarkThemeToggle />
                        <Button color="light" size="sm" onClick={logout}>
                            Sair
                        </Button>


                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Artistas</h2>
                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => setShowCreate(true)}>Criar artista</Button>
                            <Select
                                sizing="sm"
                                value={dir}
                                onChange={(e) => setDir(e.target.value as "asc" | "desc")}
                            >
                                <option value="asc">Nome (A-Z)</option>
                                <option value="desc">Nome (Z-A)</option>
                            </Select>
                            <Select
                                sizing="sm"
                                value={String(size)}
                                onChange={(e) => setSize(Number(e.target.value))}
                            >
                                <option value="8">8 / página</option>
                                <option value="12">12 / página</option>
                                <option value="24">24 / página</option>
                            </Select>
                            <div className="w-64">
                                <TextInput
                                    id="search"
                                    type="text"
                                    icon={SearchIcon}
                                    placeholder="Buscar artista..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <CreateArtistForm isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { fetchArtists(); }} />

                    {loading ? (
                        <div className="flex justify-center p-10">
                            <Spinner size="xl" aria-label="Carregando artistas..." />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {artists.map((artist) => (
                                <div
                                    key={artist.id}
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/artista/${artist.id}`)}
                                >
                                    <ArtistCard
                                        name={artist.nome}
                                        genre={artist.genero}
                                        imageUrl={artist.imageUrl}
                                        albumCount={artist.albumCount}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {pageData && totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <Pagination
                                currentPage={page + 1}
                                totalPages={totalPages}
                                onPageChange={(p) => setPage(p - 1)}
                                showIcons
                            />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
