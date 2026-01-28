import {
    Alert,
    Badge,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
} from "flowbite-react";
import { useEffect } from "react";
import { HiClock } from "react-icons/hi";
import { regionalFacade } from "../facades/RegionalFacade";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";
import { PageLayout } from "../components/layout/PageLayout";
import { useToast } from "../contexts/ToastContext";

export default function RegionalPage() {
    const data = useBehaviorSubjectValue(regionalFacade.data$);
    const loading = useBehaviorSubjectValue(regionalFacade.loading$);
    const error = useBehaviorSubjectValue(regionalFacade.error$);
    const { addToast } = useToast();

    useEffect(() => {
        regionalFacade.activate();
        return () => regionalFacade.deactivate();
    }, []);

    const handleSync = async () => {
        try {
            const r = await regionalFacade.sync();
            addToast(`Sincronizado: ${r.inserted} novos, ${r.inactivated} inativados, ${r.changed} alterados`, "success");
        } catch {
            addToast("Erro ao sincronizar regionais", "error");
        }
    };

    const isRateLimit = Boolean(
        error &&
            (error.toLowerCase().includes("muitas requisi") ||
                (error.toLowerCase().includes("rate") &&
                    error.toLowerCase().includes("limit")) ||
                error.toLowerCase().includes("429")),
    );

    return (
        <PageLayout>
            {error && (
                <Alert
                    className="mb-4"
                    color={isRateLimit ? "warning" : "failure"}
                    icon={isRateLimit ? HiClock : undefined}
                >
                    {error}
                </Alert>
            )}
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold dark:text-white">
                    Tabela Regional
                </h1>
                <Button onClick={handleSync} disabled={loading}>
                    {loading ? "Sincronizando..." : "Sincronizar"}
                </Button>
            </div>
            {loading && data.length === 0 ? (
                <div className="flex justify-center p-10">
                    <LoadingSpinner />
                </div>
            ) : (
            <div className="overflow-x-auto">
                <Table hoverable>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell>ID Externo</TableHeadCell>
                            <TableHeadCell>Nome</TableHeadCell>
                            <TableHeadCell>Ativo</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody className="divide-y">
                        {data.map((regional) => (
                            <TableRow
                                key={regional.id}
                                className="bg-white dark:border-gray-700 dark:bg-gray-800"
                            >
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    {regional.externalId}
                                </TableCell>
                                <TableCell>{regional.nome}</TableCell>
                                <TableCell>
                                    {regional.ativo ? (
                                        <Badge color="success">Sim</Badge>
                                    ) : (
                                        <Badge color="failure">Não</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                    Nenhum registro encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            )}
        </PageLayout>
    );
}

