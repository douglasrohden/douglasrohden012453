import { Pagination, Select, Card, Label } from "flowbite-react";
import { useToast } from "../contexts/ToastContext";
import { PageLayout } from "../components/layout/PageLayout";
import CreateArtistForm from "../components/CreateArtistForm";
import { useEffect, useMemo, useState } from "react";
import { Artista, artistsService } from "../services/artistsService";
import { useLocation, useNavigate } from "react-router-dom";
import { Page } from "../types/Page";
import { SearchIcon } from "../components/icons";
import { CardGrid } from "../components/common/CardGrid";
import { ListToolbar } from "../components/common/ListToolbar";

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

            <ListToolbar
                query={search}
                onQueryChange={setSearch}
                queryPlaceholder="Buscar artista..."
                queryId="search"
                searchIcon={SearchIcon}
                sortDir={dir}
                onSortDirChange={(value) => setDir(value)}
                sortDirId="sort-artistas"
                sortDirLabel="Ordem"
                addLabel="Adicionar"
                onAdd={() => setShowCreate(true)}
                extra={(
                    <div className="w-full md:w-56">
                        <Label
                            htmlFor="tipo"
                            className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300"
                        >Tipo</Label>
                        <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <option value="TODOS">Todos os tipos</option>
                            <option value="CANTOR">Cantor</option>
                            <option value="BANDA">Banda</option>
                        </Select>
                    </div>
                )}
            />

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
