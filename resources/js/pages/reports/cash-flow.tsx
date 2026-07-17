import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Printer, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Arus Kas',
        href: '/reports/cash-flow',
    },
];

interface CashItem {
    kategori_arus_kas: string;
    keterangan: string;
    tanggal: string;
    nomor_jurnal: string;
    cash_in: number | string;
    cash_out: number | string;
}

interface CashFlowProps {
    operatingItems: CashItem[];
    investingItems: CashItem[];
    financingItems: CashItem[];
    totalOperating: number;
    totalInvesting: number;
    totalFinancing: number;
    beginningCash: number;
    endingCash: number;
    netChange: number;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function CashFlow({
    operatingItems,
    investingItems,
    financingItems,
    totalOperating,
    totalInvesting,
    totalFinancing,
    beginningCash,
    endingCash,
    netChange,
    filters,
}: CashFlowProps) {
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
            route('reports.cash-flow'),
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
        router.get(route('reports.cash-flow'), {
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

    const formatParenthesis = (value: number) => {
        if (value < 0) {
            return `(${formatRupiah(Math.abs(value))})`;
        }
        return formatRupiah(value);
    };

    const renderActivitySection = (title: string, items: CashItem[], totalActivity: number) => {
        const receipts = items.filter((item) => (parseFloat(item.cash_in as string) || 0) > 0);
        const disbursements = items.filter((item) => (parseFloat(item.cash_out as string) || 0) > 0);

        const totalReceipts = receipts.reduce((sum, item) => sum + (parseFloat(item.cash_in as string) || 0), 0);
        const totalDisbursements = disbursements.reduce((sum, item) => sum + (parseFloat(item.cash_out as string) || 0), 0);

        const sectionName = title.toLowerCase().replace('arus kas dari ', '');

        return (
            <>
                {/* Section Header */}
                <tr className="bg-neutral-100 dark:bg-neutral-900/60 font-bold border-b text-foreground">
                    <td className="px-4 py-2.5 text-left text-sm uppercase tracking-wide" colSpan={3}>
                        {title}
                    </td>
                </tr>

                {/* Receipts Subheader */}
                <tr className="font-semibold text-foreground border-b bg-neutral-50/40 dark:bg-neutral-900/10 italic">
                    <td className="px-4 py-2 pl-6 text-left" colSpan={3}>
                        Penerimaan kas
                    </td>
                </tr>
                {receipts.length === 0 ? (
                    <tr className="border-b text-neutral-400">
                        <td className="px-4 py-2 pl-10 text-left italic text-xs" colSpan={3}>
                            Tidak ada penerimaan kas
                        </td>
                    </tr>
                ) : (
                    receipts.map((item, idx) => (
                        <tr key={`rec-${idx}`} className="border-b hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10">
                            <td className="px-4 py-2 pl-10 text-left text-sm">
                                <span className="text-foreground font-medium">{item.keterangan}</span>
                                <span className="text-muted-foreground block font-mono text-[9px] print:hidden">
                                    {item.nomor_jurnal} &bull; {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                </span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-sm text-foreground">
                                {formatRupiah(parseFloat(item.cash_in as string))}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-neutral-400 text-sm">
                                -
                            </td>
                        </tr>
                    ))
                )}
                <tr className="font-semibold border-b bg-neutral-50/10">
                    <td className="px-4 py-2.5 pl-8 text-left text-sm">Total penerimaan kas</td>
                    <td className="px-4 py-2.5 text-right font-mono text-neutral-400 text-sm">-</td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-foreground">
                        {formatRupiah(totalReceipts)}
                    </td>
                </tr>

                {/* Disbursements Subheader */}
                <tr className="font-semibold text-foreground border-b bg-neutral-50/40 dark:bg-neutral-900/10 italic">
                    <td className="px-4 py-2 pl-6 text-left" colSpan={3}>
                        Pengeluaran kas
                    </td>
                </tr>
                {disbursements.length === 0 ? (
                    <tr className="border-b text-neutral-400">
                        <td className="px-4 py-2 pl-10 text-left italic text-xs" colSpan={3}>
                            Tidak ada pengeluaran kas
                        </td>
                    </tr>
                ) : (
                    disbursements.map((item, idx) => (
                        <tr key={`dis-${idx}`} className="border-b hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10">
                            <td className="px-4 py-2 pl-10 text-left text-sm">
                                <span className="text-foreground font-medium">{item.keterangan}</span>
                                <span className="text-muted-foreground block font-mono text-[9px] print:hidden">
                                    {item.nomor_jurnal} &bull; {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                </span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-sm text-foreground">
                                {formatRupiah(parseFloat(item.cash_out as string))}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-neutral-400 text-sm">
                                -
                            </td>
                        </tr>
                    ))
                )}
                <tr className="font-semibold border-b bg-neutral-50/10">
                    <td className="px-4 py-2.5 pl-8 text-left text-sm">Total pengeluaran kas</td>
                    <td className="px-4 py-2.5 text-right font-mono text-neutral-400 text-sm">-</td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-red-600 dark:text-red-400">
                        {totalDisbursements > 0 ? `(${formatRupiah(totalDisbursements)})` : formatRupiah(0)}
                    </td>
                </tr>

                {/* Section Summary */}
                <tr className="font-bold border-b bg-neutral-50/50 dark:bg-neutral-900/20 text-foreground">
                    <td className="px-4 py-2.5 pl-6 text-left text-sm">
                        Arus kas bersih dari {sectionName}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-neutral-400 text-sm">-</td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold">
                        {formatParenthesis(totalActivity)}
                    </td>
                </tr>
            </>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Arus Kas (Cash Flow)" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Laporan Arus Kas</h1>
                        <p className="text-muted-foreground text-sm">
                            Ringkasan pergerakan kas masuk dan keluar berdasarkan aktivitas operasional, investasi, dan pendanaan.
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
                <div className="bg-card mx-auto w-full max-w-4xl rounded-2xl border p-8 shadow-sm print:max-w-none print:border-none print:p-0 print:shadow-none">
                    {/* Document Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Assetory Company</h2>
                        <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">Laporan Arus Kas</h3>
                        <p className="text-sm text-neutral-500 mt-1">Periode: {formatDateRange(filters.start_date, filters.end_date)}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b-2 bg-neutral-50 dark:bg-neutral-900/40">
                                    <th className="px-4 py-3 font-semibold text-sm text-neutral-600 dark:text-neutral-400">Uraian</th>
                                    <th className="px-4 py-3 text-right font-semibold text-sm text-neutral-600 dark:text-neutral-400 w-48">Nilai Transaksi</th>
                                    <th className="px-4 py-3 text-right font-semibold text-sm text-neutral-600 dark:text-neutral-400 w-48">Total Sub/Aktivitas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderActivitySection('Arus kas dari aktivitas operasi', operatingItems, totalOperating)}
                                {renderActivitySection('Arus kas dari aktivitas investasi', investingItems, totalInvesting)}
                                {renderActivitySection('Arus kas dari aktivitas pendanaan', financingItems, totalFinancing)}
                                
                                {/* Final Cash Balance summary matching image layout */}
                                <tr className="bg-neutral-50/50 dark:bg-neutral-900/30 border-t-2 font-semibold">
                                    <td className="px-4 py-3 text-sm text-foreground">Kenaikan (Penurunan) Bersih Kas</td>
                                    <td className="px-4 py-3 text-right font-mono text-neutral-400">-</td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                                        {formatParenthesis(netChange)}
                                    </td>
                                </tr>
                                <tr className="border-b font-semibold">
                                    <td className="px-4 py-3 text-sm text-foreground">Saldo Kas Awal Periode</td>
                                    <td className="px-4 py-3 text-right font-mono text-neutral-400">-</td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                                        {formatRupiah(beginningCash)}
                                    </td>
                                </tr>
                                <tr className="bg-neutral-100/50 dark:bg-neutral-900/40 border-b-2 font-bold text-foreground">
                                    <td className="px-4 py-3 text-sm uppercase">Saldo Kas Akhir Periode</td>
                                    <td className="px-4 py-3 text-right font-mono text-neutral-400">-</td>
                                    <td className="px-4 py-3 text-right font-mono text-base text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(endingCash)}
                                    </td>
                                </tr>
                            </tbody>
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
