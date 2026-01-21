import { Button, Pagination, Select, Spinner, TextInput, Card } from "flowbite-react";
import { useToast } from "../contexts/ToastContext";
import { SidebarMenu } from "../components/SidebarMenu";
import { PageHeader } from "../components/PageHeader";
import CreateArtistForm from "../components/CreateArtistForm";
import { useEffect, useMemo, useState } from "react";
import { Artista, artistsService } from "../services/artistsService";
import { useNavigate } from "react-router-dom";
import { Page } from "../types/Page";
import { useAuthFacade } from "../hooks/useAuthFacade";



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

const SortIcon = ({ dir }: { dir: "asc" | "desc" }) => (
    <svg className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={dir === 'asc' ? "M12 19V5m0 14-4-4m4 4 4-4" : "M12 5v14m0-14 4 4m-4-4-4 4"} />
    </svg>
);

export default function HomePage() {
    const { user } = useAuthFacade();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [artists, setArtists] = useState<Artista[]>([]);
    const [pageData, setPageData] = useState<Page<Artista> | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [page, setPage] = useState(0);
    const size = 10;
    const [dir, setDir] = useState<"asc" | "desc">("asc");
    const [tipo, setTipo] = useState<string>("TODOS");

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, tipo]);

    useEffect(() => {
        fetchArtists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, page, size, dir, tipo]);

    const totalPages = useMemo(() => pageData?.totalPages ?? 0, [pageData]);

    const fetchArtists = async () => {
        setLoading(true);
        try {
            const data = await artistsService.getAll(page, size, debouncedSearch, "nome", dir, tipo);
            setArtists(data.content);
            setPageData(data);
        } catch (error) {
            console.error("Failed to fetch artists", error);
            addToast("Falha ao carregar artistas", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <SidebarMenu />

            <div className="flex-1 flex flex-col">
                {/* Header Area */}
                <PageHeader title={`Bem-vindo, ${user}!`} />

                {/* Content Area */}
                <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Artistas</h2>
                    </div>
                    <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex-row">
                        <div className="w-full md:w-1/3">
                            <TextInput
                                id="search"
                                type="text"
                                icon={SearchIcon}
                                placeholder="Buscar artista..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                            <Select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                            >
                                <option value="TODOS">Todos os tipos</option>
                                <option value="CANTOR">Cantor</option>
                                <option value="BANDA">Banda</option>
                            </Select>
                            <div className="flex gap-2">
                                <Button
                                    color="gray"
                                    className="w-full md:w-auto"
                                    onClick={() => setDir(dir === "asc" ? "desc" : "asc")}
                                    title={dir === "asc" ? "Ordenar Z-A" : "Ordenar A-Z"}
                                >
                                    {dir === "asc" ? "A-Z" : "Z-A"}
                                    <SortIcon dir={dir} />
                                </Button>
                                <Button className="w-full md:w-auto" onClick={() => setShowCreate(true)}>
                                    Criar artista
                                </Button>
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
                                    <Card
                                        className="max-w-sm"
                                        imgAlt={artist.nome}
                                        imgSrc={artist.imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
                                    >
                                        <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                            {artist.nome}
                                        </h5>
                                        <p className="font-normal text-gray-700 dark:text-gray-400">
                                            {artist.genero}
                                        </p>
                                        {typeof artist.albumCount === "number" && (
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{artist.albumCount} album(s)</p>
                                        )}
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}

                    {pageData && totalPages >= 1 && (
                        <div className="flex justify-center mt-8">
                            <Pagination
                                currentPage={page + 1}
                                totalPages={totalPages}
                                onPageChange={(p) => setPage(p - 1)}
                                showIcons
                                previousLabel="Anterior"
                                nextLabel="Próxima"
                            />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
