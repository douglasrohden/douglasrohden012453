
import { Card } from "flowbite-react";

interface AlbumCardProps {
    title: string;
    year?: number;
    coverUrl?: string; // Optional cover image
}

export function AlbumCard({ title, year, coverUrl }: AlbumCardProps) {
    return (
        <Card
            className="max-w-sm"
            imgAlt={title}
            imgSrc={coverUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"} // Placeholder default
        >
            <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {title}
            </h5>
            {year && (
                <p className="font-normal text-gray-700 dark:text-gray-400">
                    {year}
                </p>
            )}
        </Card>
    );
}
