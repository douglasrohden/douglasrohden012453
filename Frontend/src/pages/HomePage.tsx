import { Button, Pagination, Select, TextInput, Card } from "flowbite-react";
import { useToast } from "../contexts/ToastContext";
import { PageLayout } from "../components/layout/PageLayout";
import CreateArtistForm from "../components/CreateArtistForm";
import { useEffect, useMemo, useState } from "react";
import { Artista, artistsService } from "../services/artistsService";
import { useLocation, useNavigate } from "react-router-dom";
import { Page } from "../types/Page";
import { SearchIcon, SortIcon } from "../components/icons";
import { CardGrid } from "../components/common/CardGrid";

export default function HomePage() {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
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
    }, [debouncedSearch, page, size, dir, tipo, location.key]);

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
        <PageLayout>
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

            <CardGrid
                loading={loading}
                isEmpty={artists.length === 0}
                emptyMessage="Nenhum artista encontrado."
                loadingMessage="Carregando artistas..."
            >
                {artists.map((artist) => (
                    <Card
                        key={artist.id}
                        className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                        imgAlt={artist.nome}
                        imgSrc={artist.imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
                        onClick={() => navigate(`/artista/${artist.id}`)}
                    >
                        <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1" title={artist.nome}>
                            {artist.nome}
                        </h5>
                        <p className="font-normal text-gray-700 dark:text-gray-400 line-clamp-1 h-6">
                            {artist.genero}
                        </p>
                        {typeof artist.albumCount === "number" && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{artist.albumCount} album(s)</p>
                        )}
                    </Card>
                ))}
            </CardGrid>

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
        </PageLayout>
    );
}
