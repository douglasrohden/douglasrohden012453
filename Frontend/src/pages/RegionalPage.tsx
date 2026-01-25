import { Badge, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";
import { useEffect } from "react";
import { regionalFacade } from "../facades/RegionalFacade";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";
import { PageLayout } from "../components/layout/PageLayout";

export default function RegionalPage() {
    const data = useBehaviorSubjectValue(regionalFacade.data$);
    const loading = useBehaviorSubjectValue(regionalFacade.loading$);
    const error = useBehaviorSubjectValue(regionalFacade.error$);

    useEffect(() => {
        regionalFacade.load();
    }, []);

    if (loading && data.length === 0) {
        return (
            <div className="flex justify-center p-10">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500">Erro: {error}</div>;
    }

    return (
        <PageLayout>
            <h1 className="mb-4 text-2xl font-bold dark:text-white">
                Tabela Regional
            </h1>
            <div className="overflow-x-auto">
                <Table hoverable>
                    <TableHead>
                        <TableHeadCell>ID</TableHeadCell>
                        <TableHeadCell>Nome</TableHeadCell>
                        <TableHeadCell>Ativo</TableHeadCell>
                    </TableHead>
                    <TableBody className="divide-y">
                        {data.map((regional) => (
                            <TableRow
                                key={regional.id}
                                className="bg-white dark:border-gray-700 dark:bg-gray-800"
                            >
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    {regional.id}
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
        </PageLayout>
    );
}
