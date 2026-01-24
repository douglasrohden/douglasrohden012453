import { Pagination, Select, Card, Label } from "flowbite-react";
import { PageLayout } from "../components/layout/PageLayout";
import CreateArtistForm from "../components/CreateArtistForm";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CardGrid } from "../components/common/CardGrid";
import { ListToolbar } from "../components/common/ListToolbar";
import { useArtists } from "../hooks/useArtists";

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showCreate, setShowCreate] = useState(false);
    const [navLock, setNavLock] = useState(false);

    // Release navigation lock when route changes.
    useEffect(() => {
        setNavLock(false);
    }, [location.pathname]);

    const {
        artists,
        loading,
        page,
        totalPages,
        search,
        tipo,
        dir,
        setPage,
        setSearch,
        setTipo,
        setDir,
        refresh
    } = useArtists();

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
                sortDir={dir}
                onSortDirChange={setDir}
                sortDirId="sort-artistas"
                sortDirLabel="Ordem"
                addLabel="Adicionar"
                onAdd={() => {
                    if (navLock) return;
                    setShowCreate(true);
                }}
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

            <CreateArtistForm isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={refresh} />

            <CardGrid
                loading={loading}
                isEmpty={artists.length === 0}
                emptyMessage="Nenhum artista encontrado."
            >
                {artists.map((artist) => (
                    <Card
                        key={artist.id}
                        className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                        imgAlt={artist.nome}
                        imgSrc={"https://flowbite.com/docs/images/blog/image-1.jpg"}
                        onClick={() => {
                            if (navLock) return;
                            setNavLock(true);
                            navigate(`/artista/${artist.id}`);
                        }}
                    >
                        <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1" title={artist.nome}>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">Nome:</span>
                            <span className="normal-case">{artist.nome ?? '—'}</span>
                        </h5>
                        <p className="font-normal text-gray-700 dark:text-gray-400 line-clamp-1 h-6">
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">Cantor/Banda:</span>
                            <span>{artist.tipo ? (artist.tipo === 'BANDA' ? 'Banda' : 'Cantor(a)') : '—'}</span>
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">Gênero:</span>
                            <span>{artist.genero ?? '—'}</span>
                        </p>
                        {typeof artist.albumCount === "number" && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300"><span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">Álbuns:</span>{artist.albumCount} {artist.albumCount === 1 ? 'álbum' : 'álbuns'}</p>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/artista/${artist.id}`); }}
                            className="w-full mt-4 px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                            Álbuns
                        </button>
                    </Card>
                ))}
            </CardGrid>

            {totalPages >= 1 && (
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
