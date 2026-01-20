import { Button, DarkThemeToggle } from "flowbite-react";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
    const { user, logout } = useAuth();

    const CARDS = [
        {
            title: "Flowbite React Docs",
            description:
                "Learn more on how to get started and use the Flowbite React components",
            url: "https://flowbite-react.com/",
            icon: (
                <svg
                    className="h-9 w-9 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M12 6.03v13m0-13c-2.819-.831-4.715-1.076-8.029-1.023A.99.99 0 0 0 3 6v11c0 .563.466 1.014 1.03 1.007 3.122-.043 5.018.212 7.97 1.023m0-13c2.819-.831 4.715-1.076 8.029-1.023A.99.99 0 0 1 21 6v11c0 .563-.466 1.014-1.03 1.007-3.122-.043-5.018.212-7.97 1.023"
                    />
                </svg>
            ),
        },
        // ... (other cards can be added here)
    ];

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-24 dark:bg-gray-900">
            <div className="absolute top-4 right-4 flex gap-2">
                <DarkThemeToggle />
                <Button color="light" onClick={logout}>
                    Sair
                </Button>
            </div>

            <div className="relative flex w-full max-w-5xl flex-col items-center justify-center gap-12">
                <div className="relative flex flex-col items-center gap-6">
                    <h1 className="relative text-center text-4xl leading-[125%] font-bold text-gray-900 dark:text-gray-200">
                        Bem-vindo, {user}!
                    </h1>
                    <span className="inline-flex flex-wrap items-center justify-center gap-2.5 text-center">
                        <span className="inline text-xl text-gray-600 dark:text-gray-400">
                            Você está na área logada.
                        </span>
                    </span>
                </div>

                {/* Placeholder functionality reusing previous layout structure */}
                <div className="relative flex w-full flex-col items-start gap-6 self-stretch">
                    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                        {CARDS.map((card) => (
                            <a
                                key={card.title}
                                href={card.url}
                                target="_blank"
                                className="outline-primary-600 dark:outline-primary-500 group hover:border-primary-600 dark:hover:border-primary-500 cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 outline-offset-2 focus:outline-2 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="flex items-center gap-6 p-4">
                                    <div className="flex flex-1 items-center gap-2">
                                        <div className="size-9">{card.icon}</div>

                                        <div className="flex flex-1 flex-col items-start justify-center gap-1.5 border-l border-gray-200 pl-3.5 dark:border-gray-700">
                                            <div className="w-full font-sans text-lg leading-4 font-semibold text-gray-900 dark:text-gray-200">
                                                {card.title}
                                            </div>

                                            <div className="w-full font-sans text-sm leading-5 font-normal text-gray-500 dark:text-gray-400">
                                                {card.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
