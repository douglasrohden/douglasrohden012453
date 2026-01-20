
import { Card } from "flowbite-react";

interface ArtistCardProps {
    name: string;
    genre: string;
    imageUrl?: string;
}

export function ArtistCard({ name, genre, imageUrl }: ArtistCardProps) {
    return (
        <Card
            className="max-w-sm"
            imgAlt={name}
            imgSrc={imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
        >
            <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {name}
            </h5>
            <p className="font-normal text-gray-700 dark:text-gray-400">
                {genre}
            </p>
        </Card>
    );
}
