import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Coa } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Printer, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Neraca Saldo',
        href: '/reports/trial-balance',
    },
];

interface TrialBalanceProps {
    coas: (Coa & {
        saldo_awal_debit: number;
        saldo_awal_kredit: number;
        mutasi_debit: number;
        mutasi_kredit: number;
        saldo_akhir_debit: number;
        saldo_akhir_kredit: number;
    })[];
    totalAwalDebit: number;
    totalAwalKredit: number;
    totalMutasiDebit: number;
    totalMutasiKredit: number;
    totalAkhirDebit: number;
    totalAkhirKredit: number;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function TrialBalance({
    coas,
    totalAwalDebit,
    totalAwalKredit,
    totalMutasiDebit,
    totalMutasiKredit,
    totalAkhirDebit,
    totalAkhirKredit,
    filters,
}: TrialBalanceProps) {
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
            route('reports.trial-balance'),
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
        router.get(route('reports.trial-balance'), {
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

    const difference = Math.abs(totalAkhirDebit - totalAkhirKredit);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Neraca Saldo (Trial Balance)" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Neraca Saldo</h1>
                        <p className="text-muted-foreground text-sm">
                            Ringkasan saldo awal, mutasi mutasi berjalan, dan saldo akhir untuk setiap akun.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Cetak Laporan
                        </Button>
                    </div>
                </div>

                {/* Error Banner */}
                {(localError || (errors && errors.start_date)) && (
                    <Alert variant="destructive" className="print:hidden">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Kesalahan</AlertTitle>
                        <AlertDescription>{localError || (errors.start_date as string)}</AlertDescription>
                    </Alert>
                )}

                {/* Filter Card */}
                <div className="bg-card rounded-xl border p-4 print:hidden">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-1.5">
                            <label htmlFor="start_date" className="text-sm font-medium">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                id="start_date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-input bg-background text-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="end_date" className="text-sm font-medium">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                id="end_date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border-input bg-background text-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="h-9">
                                Terapkan Filter
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleReset} className="h-9 gap-1.5">
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Report Content */}
                <div className="bg-card overflow-hidden rounded-xl border shadow-xs print:border-none print:shadow-none">
                    {/* Print Only Header */}
                    <div className="mb-6 hidden text-center print:block">
                        <h2 className="text-xl font-bold uppercase">Assetory</h2>
                        <h1 className="text-2xl font-bold">Laporan Neraca Saldo (Trial Balance)</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Periode: {formatDateRange(filters.start_date, filters.end_date)}</p>
                        <hr className="my-4 border-gray-300" />
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="bg-muted/40 text-muted-foreground border-b text-center text-[11px] font-semibold tracking-wider uppercase print:bg-transparent">
                                    <th className="w-40 px-4 py-3 text-left" rowSpan={2}>
                                        Kode Akun
                                    </th>
                                    <th className="px-4 py-3 text-left" rowSpan={2}>
                                        Nama Akun
                                    </th>
                                    <th className="border-r border-l px-4 py-3 text-center" colSpan={2}>
                                        Saldo Awal
                                    </th>
                                    <th className="border-r px-4 py-3 text-center" colSpan={2}>
                                        Mutasi
                                    </th>
                                    <th className="px-4 py-3 text-center" colSpan={2}>
                                        Saldo Akhir
                                    </th>
                                </tr>
                                <tr className="bg-muted/40 text-muted-foreground border-b text-right text-[10px] font-semibold tracking-wider uppercase print:bg-transparent">
                                    <th className="border-l px-4 py-2 text-right">Debit</th>
                                    <th className="border-r px-4 py-2 text-right">Kredit</th>
                                    <th className="px-4 py-2 text-right">Debit</th>
                                    <th className="border-r px-4 py-2 text-right">Kredit</th>
                                    <th className="px-4 py-2 text-right">Debit</th>
                                    <th className="px-4 py-2 text-right">Kredit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {coas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-muted-foreground px-6 py-12 text-center">
                                            Tidak ada transaksi pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    coas.map((coa) => (
                                        <tr key={coa.id} className="hover:bg-muted/30 transition-colors print:hover:bg-transparent">
                                            <td className="px-4 py-3 font-mono font-medium">{coa.kode_akun}</td>
                                            <td className="px-4 py-3 font-medium">{coa.nama_akun}</td>

                                            {/* Saldo Awal */}
                                            <td className="text-muted-foreground border-l px-4 py-3 text-right font-mono">
                                                {coa.saldo_awal_debit > 0 ? formatRupiah(coa.saldo_awal_debit) : '-'}
                                            </td>
                                            <td className="text-muted-foreground border-r px-4 py-3 text-right font-mono">
                                                {coa.saldo_awal_kredit > 0 ? formatRupiah(coa.saldo_awal_kredit) : '-'}
                                            </td>

                                            {/* Mutasi */}
                                            <td className="px-4 py-3 text-right font-mono">
                                                {coa.mutasi_debit > 0 ? formatRupiah(coa.mutasi_debit) : '-'}
                                            </td>
                                            <td className="border-r px-4 py-3 text-right font-mono">
                                                {coa.mutasi_kredit > 0 ? formatRupiah(coa.mutasi_kredit) : '-'}
                                            </td>

                                            {/* Saldo Akhir */}
                                            <td className="text-foreground px-4 py-3 text-right font-mono font-semibold">
                                                {coa.saldo_akhir_debit > 0 ? formatRupiah(coa.saldo_akhir_debit) : '-'}
                                            </td>
                                            <td className="text-foreground px-4 py-3 text-right font-mono font-semibold">
                                                {coa.saldo_akhir_kredit > 0 ? formatRupiah(coa.saldo_akhir_kredit) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-muted/50 border-border border-t-2 text-right font-bold print:bg-transparent">
                                    <td colSpan={2} className="px-4 py-3 text-left text-base">
                                        TOTAL
                                    </td>

                                    {/* Total Saldo Awal */}
                                    <td className="text-muted-foreground border-l px-4 py-3 text-right font-mono text-base">
                                        {formatRupiah(totalAwalDebit)}
                                    </td>
                                    <td className="text-muted-foreground border-r px-4 py-3 text-right font-mono text-base">
                                        {formatRupiah(totalAwalKredit)}
                                    </td>

                                    {/* Total Mutasi */}
                                    <td className="px-4 py-3 text-right font-mono text-base">{formatRupiah(totalMutasiDebit)}</td>
                                    <td className="border-r px-4 py-3 text-right font-mono text-base">{formatRupiah(totalMutasiKredit)}</td>

                                    {/* Total Saldo Akhir */}
                                    <td className="text-foreground px-4 py-3 text-right font-mono text-base">{formatRupiah(totalAkhirDebit)}</td>
                                    <td className="text-foreground px-4 py-3 text-right font-mono text-base">{formatRupiah(totalAkhirKredit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Print Verification Alert */}
                {difference > 0.01 && (
                    <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-3 rounded-lg border p-4 text-sm font-medium print:hidden">
                        <AlertCircle className="h-5 w-5" />
                        Peringatan: Neraca Saldo Akhir tidak seimbang! Selisih sebesar {formatRupiah(difference)}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
