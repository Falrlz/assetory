import { Field, PageShell } from '@/components/page-header';
import { formatDateRange, ReportDocument, ReportFilterCard, ReportSignatures, ReportToolbar } from '@/components/reports/report-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableEmpty, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Perubahan Ekuitas',
        href: '/reports/equity-change',
    },
];

interface EquityItem {
    kode_akun: string;
    nama_akun: string;
    saldo_awal: number;
    tambahan: number;
    laba_net: number;
    saldo_akhir: number;
}

interface EquityChangeProps {
    equityItems: EquityItem[];
    totalAwal: number;
    totalTambahan: number;
    totalLabaNet: number;
    totalAkhir: number;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function EquityChange({ equityItems, totalAwal, totalTambahan, totalLabaNet, totalAkhir, filters }: EquityChangeProps) {
    const { errors } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();

        const startYear = new Date(startDate).getFullYear();
        const endYear = new Date(endDate).getFullYear();

        if (startYear !== endYear) {
            setLocalError('Rentang tanggal tidak boleh melewati dua tahun yang berbeda.');
            return;
        }

        setLocalError(null);
        router.get(
            route('reports.equity-change'),
            {
                start_date: startDate,
                end_date: endDate,
            },
            {
                preserveState: true,
            },
        );
    };

    const handleReset = () => {
        setLocalError(null);
        const currentYear = new Date().getFullYear();
        const start = `${currentYear}-01-01`;
        const end = new Date().toISOString().split('T')[0];
        setStartDate(start);
        setEndDate(end);
        router.get(route('reports.equity-change'), {
            start_date: start,
            end_date: end,
        });
    };

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    /** Movements carry an explicit sign so increases and decreases read at a glance. */
    const formatSigned = (value: number) => {
        if (value > 0) return `+${formatRupiah(value)}`;
        if (value < 0) return `−${formatRupiah(Math.abs(value))}`;
        return formatRupiah(0);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Perubahan Ekuitas" />

            <PageShell className="print:p-0">
                <ReportToolbar
                    title="Laporan Perubahan Ekuitas"
                    description="Menampilkan riwayat perubahan struktur modal pemilik selama satu periode akuntansi."
                />

                {(errors.start_date || errors.end_date || localError) && (
                    <Alert variant="destructive" className="print:hidden">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Kesalahan Validasi</AlertTitle>
                        <AlertDescription>{errors.start_date || errors.end_date || localError}</AlertDescription>
                    </Alert>
                )}

                <ReportFilterCard onSubmit={handleFilter} onReset={handleReset}>
                    <Field className="w-48">
                        <Label htmlFor="start_date">Tanggal Mulai</Label>
                        <DatePicker id="start_date" value={startDate} onChange={setStartDate} />
                    </Field>
                    <Field className="w-48">
                        <Label htmlFor="end_date">Tanggal Selesai</Label>
                        <DatePicker id="end_date" value={endDate} onChange={setEndDate} />
                    </Field>
                </ReportFilterCard>

                <ReportDocument title="Laporan Perubahan Ekuitas" period={`Periode ${formatDateRange(filters.start_date, filters.end_date)}`}>
                    <Table minWidth="min-w-[900px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="min-w-[220px]">Akun Ekuitas</TableHead>
                                <TableHead align="right" className="w-44">
                                    Saldo Awal
                                </TableHead>
                                <TableHead align="right" className="w-44">
                                    Setoran Modal
                                </TableHead>
                                <TableHead align="right" className="w-44">
                                    Laba Bersih
                                </TableHead>
                                <TableHead align="right" className="w-44">
                                    Saldo Akhir
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {equityItems.length === 0 ? (
                                <TableEmpty colSpan={5} description="Tidak ada riwayat transaksi ekuitas pada periode ini." />
                            ) : (
                                equityItems.map((item) => (
                                    <TableRow key={item.kode_akun}>
                                        <TableCell>
                                            <span className="text-foreground block font-medium">{item.nama_akun}</span>
                                            <span className="text-muted-foreground block font-mono text-xs">{item.kode_akun}</span>
                                        </TableCell>
                                        <TableCell numeric className="text-foreground">
                                            {formatRupiah(item.saldo_awal)}
                                        </TableCell>
                                        <TableCell numeric className="text-emerald-600 dark:text-emerald-400">
                                            {formatSigned(item.tambahan)}
                                        </TableCell>
                                        <TableCell numeric className="text-emerald-600 dark:text-emerald-400">
                                            {formatSigned(item.laba_net)}
                                        </TableCell>
                                        <TableCell numeric className="text-foreground font-semibold">
                                            {formatRupiah(item.saldo_akhir)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="hover:bg-transparent">
                                <TableCell className="uppercase">Total Ekuitas</TableCell>
                                <TableCell numeric>{formatRupiah(totalAwal)}</TableCell>
                                <TableCell numeric className="text-emerald-600 dark:text-emerald-400">
                                    {formatSigned(totalTambahan)}
                                </TableCell>
                                <TableCell numeric className="text-emerald-600 dark:text-emerald-400">
                                    {formatSigned(totalLabaNet)}
                                </TableCell>
                                <TableCell numeric className="text-base">
                                    {formatRupiah(totalAkhir)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>

                    <ReportSignatures />
                </ReportDocument>
            </PageShell>
        </AppLayout>
    );
}
