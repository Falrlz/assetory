import { Field, PageShell } from '@/components/page-header';
import { ReportDocument, ReportFilterCard, ReportSignatures, ReportToolbar } from '@/components/reports/report-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    hasAppliedFilter?: boolean;
    filters: {
        year?: string;
    };
}

export default function EquityChange({
    equityItems,
    totalAwal,
    totalTambahan,
    totalLabaNet,
    totalAkhir,
    hasAppliedFilter = false,
    filters,
}: EquityChangeProps) {
    const { errors } = usePage().props;
    const [selectedYear, setSelectedYear] = useState<string>(filters.year || '');
    const [localError, setLocalError] = useState<string | null>(null);

    const currentCalendarYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 7 }, (_, i) => (currentCalendarYear - 5 + i).toString());

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedYear) {
            setLocalError('Silakan pilih Tahun Buku laporan terlebih dahulu.');
            return;
        }

        setLocalError(null);
        router.get(
            route('reports.equity-change'),
            {
                year: selectedYear,
            },
            {
                preserveState: true,
            },
        );
    };

    const handleReset = () => {
        setLocalError(null);
        setSelectedYear('');
        router.get(route('reports.equity-change'), {});
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
                    description="Menampilkan riwayat perubahan struktur modal pemilik selama satu Tahun Buku."
                />

                {(errors.year || localError) && (
                    <Alert variant="destructive" className="print:hidden">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Kesalahan Validasi</AlertTitle>
                        <AlertDescription>{(errors.year as string) || localError}</AlertDescription>
                    </Alert>
                )}

                <ReportFilterCard onSubmit={handleFilter} onReset={handleReset} disabled={!selectedYear}>
                    <Field className="w-56">
                        <Label htmlFor="year">Pilih Tahun Buku</Label>
                        <select
                            id="year"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                        >
                            <option value="">-- Pilih Tahun --</option>
                            {availableYears.map((y) => (
                                <option key={y} value={y}>
                                    Tahun Buku {y}
                                </option>
                            ))}
                        </select>
                    </Field>
                </ReportFilterCard>

                {!hasAppliedFilter ? (
                    <div className="bg-card flex flex-col items-center justify-center rounded-xl border p-12 text-center shadow-xs">
                        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                            <AlertCircle className="text-muted-foreground size-6" />
                        </div>
                        <h3 className="text-foreground mt-4 text-base font-semibold">Silakan Pilih Tahun Buku Laporan</h3>
                        <p className="text-muted-foreground mt-1.5 max-w-sm text-xs">
                            Pilih <span className="font-semibold">Tahun Buku</span> di atas, lalu klik tombol{' '}
                            <span className="font-semibold">"Tampilkan Laporan"</span> untuk memuat Perubahan Ekuitas.
                        </p>
                    </div>
                ) : (
                    <ReportDocument
                        title="Laporan Perubahan Ekuitas"
                        period={`Tahun Buku ${selectedYear} (1 Jan ${selectedYear} - 31 Des ${selectedYear})`}
                    >
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
                                    <TableEmpty colSpan={5} description="Tidak ada riwayat transaksi ekuitas pada tahun ini." />
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
                                    <TableCell numeric className="font-bold">
                                        {formatRupiah(totalAkhir)}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>

                        <ReportSignatures />
                    </ReportDocument>
                )}
            </PageShell>
        </AppLayout>
    );
}
