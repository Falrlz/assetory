import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Printer, RotateCcw } from 'lucide-react';
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

export default function EquityChange({
    equityItems,
    totalAwal,
    totalTambahan,
    totalLabaNet,
    totalAkhir,
    filters,
}: EquityChangeProps) {
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
        const end = `${currentYear}-12-31`;
        setStartDate(start);
        setEndDate(end);
        router.get(route('reports.equity-change'), {
            start_date: start,
            end_date: end,
        });
    };

    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDateRange = (start: string, end: string) => {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const s = new Date(start).toLocaleDateString('id-ID', options);
        const e = new Date(end).toLocaleDateString('id-ID', options);
        return `${s} - ${e}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Perubahan Ekuitas" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Perubahan Ekuitas</h1>
                        <p className="text-sm text-neutral-500">
                            Menampilkan riwayat perubahan struktur modal pemilik selama satu periode akuntansi.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Cetak Laporan
                        </Button>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="rounded-xl border bg-card p-4 shadow-sm print:hidden">
                    <form onSubmit={handleFilter} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="grid flex-1 gap-1.5">
                            <label htmlFor="start_date" className="text-xs font-semibold text-neutral-500 uppercase">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                id="start_date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                            />
                        </div>
                        <div className="grid flex-1 gap-1.5">
                            <label htmlFor="end_date" className="text-xs font-semibold text-neutral-500 uppercase">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                id="end_date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="h-9">
                                Filter
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleReset} className="h-9">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>

                    {(errors.start_date || errors.end_date || localError) && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Kesalahan Validasi</AlertTitle>
                            <AlertDescription>
                                {errors.start_date || errors.end_date || localError}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Printable Report Layout */}
                <div className="flex-1 rounded-2xl border bg-card p-8 shadow-sm print:border-none print:p-0 print:shadow-none">
                    {/* Company Header (visible on print) */}
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-foreground">Assetory Company</h2>
                        <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">Laporan Perubahan Ekuitas</h3>
                        <p className="text-sm text-neutral-500 mt-1">Periode: {formatDateRange(filters.start_date, filters.end_date)}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-neutral-50 dark:bg-neutral-900/50">
                                    <th className="px-4 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Akun Ekuitas</th>
                                    <th className="px-4 py-3 text-right font-semibold text-neutral-600 dark:text-neutral-400">Saldo Awal</th>
                                    <th className="px-4 py-3 text-right font-semibold text-neutral-600 dark:text-neutral-400">Setoran Modal</th>
                                    <th className="px-4 py-3 text-right font-semibold text-neutral-600 dark:text-neutral-400">Laba Bersih</th>
                                    <th className="px-4 py-3 text-right font-semibold text-neutral-600 dark:text-neutral-400">Saldo Akhir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equityItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                                            Tidak ada riwayat transaksi ekuitas pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    equityItems.map((item) => (
                                        <tr key={item.kode_akun} className="border-b hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{item.nama_akun}</div>
                                                <div className="text-xs text-neutral-500">{item.kode_akun}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-foreground font-mono">
                                                {formatRupiah(item.saldo_awal)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                                                {item.tambahan > 0 ? `+${formatRupiah(item.tambahan)}` : item.tambahan < 0 ? `-${formatRupiah(Math.abs(item.tambahan))}` : formatRupiah(0)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                                                {item.laba_net > 0 ? `+${formatRupiah(item.laba_net)}` : item.laba_net < 0 ? `-${formatRupiah(Math.abs(item.laba_net))}` : formatRupiah(0)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-foreground font-mono">
                                                {formatRupiah(item.saldo_akhir)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-b bg-neutral-50/50 dark:bg-neutral-900/30 font-semibold text-foreground">
                                    <td className="px-4 py-3 text-left">Total Ekuitas</td>
                                    <td className="px-4 py-3 text-right font-mono">{formatRupiah(totalAwal)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                        {totalTambahan > 0 ? `+${formatRupiah(totalTambahan)}` : totalTambahan < 0 ? `-${formatRupiah(Math.abs(totalTambahan))}` : formatRupiah(0)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                        {totalLabaNet > 0 ? `+${formatRupiah(totalLabaNet)}` : totalLabaNet < 0 ? `-${formatRupiah(Math.abs(totalLabaNet))}` : formatRupiah(0)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-lg">{formatRupiah(totalAkhir)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Report Footer (visible on print) */}
                    <div className="mt-16 hidden justify-between text-center print:flex">
                        <div className="w-48 border-t border-neutral-400 pt-2 text-sm text-neutral-500">
                            Dibuat Oleh, <br /><br /><br /><br />
                            ( Staff Akunting )
                        </div>
                        <div className="w-48 border-t border-neutral-400 pt-2 text-sm text-neutral-500">
                            Disetujui Oleh, <br /><br /><br /><br />
                            ( Pemilik Perusahaan )
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
