import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Printer, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Posisi Keuangan',
        href: '/reports/balance-sheet',
    },
];

interface Account {
    id: number;
    kode_akun: string;
    nama_akun: string;
    kategori: string;
    saldo: number;
}

interface BalanceSheetProps {
    assets: Account[];
    liabilities: Account[];
    equity: Account[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
    filters: {
        end_date: string;
    };
}

export default function BalanceSheet({
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity,
    filters,
}: BalanceSheetProps) {
    const [endDate, setEndDate] = useState(filters.end_date);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('reports.balance-sheet'),
            {
                end_date: endDate,
            },
            {
                preserveState: true,
            },
        );
    };

    const handleReset = () => {
        const today = new Date().toISOString().split('T')[0];
        setEndDate(today);
        router.get(route('reports.balance-sheet'), {
            end_date: today,
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

    const formatAsDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Posisi Keuangan" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Laporan Posisi Keuangan</h1>
                        <p className="text-muted-foreground text-sm">
                            Laporan Posisi Keuangan yang memuat Aset, Kewajiban, dan Ekuitas organisasi Anda.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Cetak Laporan
                        </Button>
                    </div>
                </div>

                {/* Filter Card */}
                <div className="bg-card rounded-xl border p-4 print:hidden">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-1.5">
                            <label htmlFor="end_date" className="text-sm font-medium">
                                Per Tanggal
                            </label>
                            <DatePicker
                                id="end_date"
                                value={endDate}
                                onChange={setEndDate}
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
                <div className="bg-card rounded-xl border p-6 md:p-8 print:border-none print:p-0 print:shadow-none">
                    {/* Print Only Header */}
                    <div className="mb-6 hidden text-center print:block">
                        <h2 className="text-xl font-bold uppercase">Assetory</h2>
                        <h1 className="text-2xl font-bold">Laporan Posisi Keuangan (Neraca)</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Per tanggal: {formatAsDate(filters.end_date)}</p>
                        <hr className="my-4 border-gray-300" />
                    </div>

                    <div className="mb-8 hidden text-center md:block print:hidden">
                        <h2 className="text-md text-muted-foreground font-semibold uppercase">Laporan Posisi Keuangan</h2>
                        <h1 className="text-foreground mt-0.5 text-2xl font-bold">LAPORAN POSISI KEUANGAN</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Per tanggal {formatAsDate(filters.end_date)}</p>
                    </div>

                    {/* Dual Column Layout for Large Screens & Print */}
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                        {/* ASSETS COLUMN */}
                        <div className="space-y-6">
                            <div className="border-b pb-2">
                                <h3 className="text-primary text-lg font-bold uppercase">1. ASET</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="text-muted-foreground text-sm font-semibold">Aset Tetap & Aset Lancar</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {assets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="text-muted-foreground py-2 text-center">
                                                        Tidak ada saldo aset.
                                                    </td>
                                                </tr>
                                            ) : (
                                                assets.map((item) => (
                                                    <tr key={item.id} className="border-border/40 hover:bg-muted/10 border-b last:border-0">
                                                        <td className="text-muted-foreground w-28 py-2.5 font-mono text-xs">{item.kode_akun}</td>
                                                        <td className="py-2.5 font-medium">{item.nama_akun}</td>
                                                        <td className="py-2.5 text-right font-mono font-medium">{formatRupiah(item.saldo)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-muted/30 border-border flex items-center justify-between rounded-lg border-t-2 p-3">
                                <span className="text-sm font-bold uppercase">TOTAL ASET</span>
                                <span className="text-primary font-mono text-base font-bold">{formatRupiah(totalAssets)}</span>
                            </div>
                        </div>

                        {/* LIABILITIES AND EQUITY COLUMN */}
                        <div className="space-y-6">
                            {/* LIABILITIES */}
                            <div className="space-y-4">
                                <div className="border-b pb-2">
                                    <h3 className="text-primary text-lg font-bold uppercase">2. KEWAJIBAN (UTANG)</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {liabilities.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="text-muted-foreground py-2 text-center">
                                                    Tidak ada saldo kewajiban.
                                                </td>
                                            </tr>
                                        ) : (
                                            liabilities.map((item) => (
                                                <tr key={item.id} className="border-border/40 hover:bg-muted/10 border-b last:border-0">
                                                    <td className="text-muted-foreground w-28 py-2.5 font-mono text-xs">{item.kode_akun}</td>
                                                    <td className="py-2.5 font-medium">{item.nama_akun}</td>
                                                    <td className="py-2.5 text-right font-mono font-medium">{formatRupiah(item.saldo)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                                    <span className="text-xs font-semibold uppercase">Total Kewajiban</span>
                                    <span className="font-mono text-sm font-bold">{formatRupiah(totalLiabilities)}</span>
                                </div>
                            </div>

                            {/* EQUITY */}
                            <div className="space-y-4 pt-2">
                                <div className="border-b pb-2">
                                    <h3 className="text-primary text-lg font-bold uppercase">3. EKUITAS (MODAL)</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {equity.map((item) => (
                                            <tr key={item.id} className="border-border/40 hover:bg-muted/10 border-b last:border-0">
                                                <td className="text-muted-foreground w-28 py-2.5 font-mono text-xs">{item.kode_akun}</td>
                                                <td className="py-2.5 font-medium">{item.nama_akun}</td>
                                                <td className="py-2.5 text-right font-mono font-medium">{formatRupiah(item.saldo)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                                    <span className="text-xs font-semibold uppercase">Total Ekuitas</span>
                                    <span className="font-mono text-sm font-bold">{formatRupiah(totalEquity)}</span>
                                </div>
                            </div>

                            {/* LIABILITIES + EQUITY TOTAL */}
                            <div className="bg-muted/30 border-border flex items-center justify-between rounded-lg border-t-2 p-3">
                                <span className="text-sm font-bold uppercase">TOTAL KEWAJIBAN & EKUITAS</span>
                                <span className="text-primary font-mono text-base font-bold">{formatRupiah(totalLiabilitiesAndEquity)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Balance Check */}
                    {Math.abs(totalAssets - totalLiabilitiesAndEquity) > 0.01 && (
                        <div className="bg-destructive/10 border-destructive/20 text-destructive mt-8 rounded-lg border p-4 text-center text-sm font-medium print:hidden">
                            Peringatan: Posisi Neraca tidak seimbang! Selisih Aset vs (Kewajiban+Ekuitas) sebesar{' '}
                            {formatRupiah(Math.abs(totalAssets - totalLiabilitiesAndEquity))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
