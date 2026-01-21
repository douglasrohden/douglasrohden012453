export const SearchIcon = () => (
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

export const SortIcon = ({ dir }: { dir: "asc" | "desc" }) => (
    <svg
        className="w-5 h-5 ml-2 -mr-1"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={dir === 'asc' ? "M12 19V5m0 14-4-4m4 4 4-4" : "M12 5v14m0-14 4 4m-4-4-4 4"}
        />
    </svg>
);
