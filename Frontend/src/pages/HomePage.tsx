import { Button, DarkThemeToggle, TextInput, Spinner } from "flowbite-react";
import { useAuth } from "../contexts/AuthContext";
import { SidebarMenu } from "../components/SidebarMenu";
import { ArtistCard } from "../components/ArtistCard";
import CreateArtistForm from "../components/CreateArtistForm";
import { useEffect, useState } from "react";
import { Artista, artistsService } from "../services/artistsService";



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
    const { user, logout } = useAuth();
    const [artists, setArtists] = useState<Artista[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchArtists();
    }, [search]);

    const fetchArtists = async () => {
        setLoading(true);
        try {
            const data = await artistsService.getAll(0, 10, search);
            setArtists(data.content);
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
                                <ArtistCard
                                    key={artist.id}
                                    name={artist.nome}
                                    genre={artist.genero}
                                    imageUrl={artist.imageUrl}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
