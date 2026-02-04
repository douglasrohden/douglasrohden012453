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
import { useEffect, useMemo, useRef } from "react";
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
    const tempIdRef = useRef(-1);
    const sortedData = useMemo(
        () =>
            data
                .map((item, index) => ({ item, index }))
                .sort(
                    (a, b) =>
                        a.item.externalId - b.item.externalId || a.index - b.index,
                )
                .map(({ item }) => item),
        [data],
    );

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

    const nextTempId = () => {
        const next = tempIdRef.current;
        tempIdRef.current -= 1;
        return next;
    };

    const handleSimulateNew = () => {
        const current = regionalFacade.snapshot.data;
        const nextExternalId =
            current.reduce((maxId, regional) => Math.max(maxId, regional.externalId), 0) + 1;
        regionalFacade.data$.next([
            ...current,
            {
                id: nextTempId(),
                externalId: nextExternalId,
                nome: `Regional Simulada ${nextExternalId}`,
                ativo: true,
            },
        ]);
        addToast("Simulação: novo regional inserido.", "success");
    };

    const handleSimulateUnavailable = () => {
        const current = regionalFacade.snapshot.data;
        const targetIndex = current.findIndex((regional) => regional.ativo);
        if (targetIndex < 0) {
            addToast("Simulação: nenhuma regional ativa para inativar.", "warning");
            return;
        }

        const target = current[targetIndex];
        const next = current.map((regional, index) =>
            index === targetIndex ? { ...regional, ativo: false } : regional,
        );
        regionalFacade.data$.next(next);
        addToast(`Simulação: regional ${target.externalId} inativada.`, "success");
    };

    const handleSimulateChange = () => {
        const current = regionalFacade.snapshot.data;
        const targetIndex = current.findIndex((regional) => regional.ativo);
        if (targetIndex < 0) {
            addToast("Simulação: nenhuma regional ativa para alterar.", "warning");
            return;
        }

        const target = current[targetIndex];
        const next = current.map((regional, index) =>
            index === targetIndex ? { ...regional, ativo: false } : regional,
        );
        regionalFacade.data$.next([
            ...next,
            {
                id: nextTempId(),
                externalId: target.externalId,
                nome: `${target.nome} (Atualizada)`,
                ativo: true,
            },
        ]);
        addToast(`Simulação: regional ${target.externalId} alterada.`, "success");
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
                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={handleSync} disabled={loading}>
                        {loading ? "Sincronizando..." : "Sincronizar"}
                    </Button>
                    <Button color="light" size="sm" onClick={handleSimulateNew} disabled={loading}>
                        Simular Novo
                    </Button>
                    <Button
                        color="light"
                        size="sm"
                        onClick={handleSimulateUnavailable}
                        disabled={loading}
                    >
                        Simular Indisponível
                    </Button>
                    <Button
                        color="light"
                        size="sm"
                        onClick={handleSimulateChange}
                        disabled={loading}
                    >
                        Simular Alteração
                    </Button>
                </div>
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
                        {sortedData.map((regional) => (
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

