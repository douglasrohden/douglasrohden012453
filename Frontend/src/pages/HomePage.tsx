import { Button, DarkThemeToggle } from "flowbite-react";
import { useAuth } from "../contexts/AuthContext";
import { SidebarMenu } from "../components/SidebarMenu";
import { ArtistCard } from "../components/ArtistCard";

export default function HomePage() {
    const { user, logout } = useAuth();

    const ARTISTS = [
        {
            name: "The Weeknd",
            genre: "R&B, Pop",
            imageUrl: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb",
        },
        {
            name: "Ed Sheeran",
            genre: "Pop",
            imageUrl: "https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6db6d3",
        },
        {
            name: "Taylor Swift",
            genre: "Pop, Country",
            imageUrl: "https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0",
        },
        {
            name: "Beyoncé",
            genre: "R&B, Pop",
            imageUrl: "https://i.scdn.co/image/ab6761610000e5eb249d55f2d68a44637905c57e",
        },
        {
            name: "Drake",
            genre: "Hip-Hop, Rap",
            imageUrl: "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9",
        },
    ];

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
                    <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Artistas Populares</h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {ARTISTS.map((artist) => (
                            <ArtistCard
                                key={artist.name}
                                name={artist.name}
                                genre={artist.genre}
                                imageUrl={artist.imageUrl}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
