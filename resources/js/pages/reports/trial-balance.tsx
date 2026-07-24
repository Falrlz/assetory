import { Field, PageShell } from '@/components/page-header';
import { formatDateRange, ReportFilterCard, ReportToolbar } from '@/components/reports/report-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableContainer, TableEmpty, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Coa } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
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

/** Vertical rule closing each Debit/Kredit column pair. */
const GROUP_DIVIDER = 'border-border/60 border-r';

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
        const end = new Date().toISOString().split('T')[0];
        setStartDate(start);
        setEndDate(end);
        router.get(route('reports.trial-balance'), {
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

    const difference = Math.abs(totalAkhirDebit - totalAkhirKredit);

    let totalLrDebit = 0;
    let totalLrKredit = 0;
    let totalLpkDebit = 0;
    let totalLpkKredit = 0;

    coas.forEach((coa) => {
        if (coa.jenis_laporan === 'LR') {
            totalLrDebit += Number(coa.saldo_akhir_debit) || 0;
            totalLrKredit += Number(coa.saldo_akhir_kredit) || 0;
        } else if (coa.jenis_laporan === 'LPK') {
            totalLpkDebit += Number(coa.saldo_akhir_debit) || 0;
            totalLpkKredit += Number(coa.saldo_akhir_kredit) || 0;
        }
    });

    const netIncome = totalLrKredit - totalLrDebit;

    /** Renders an amount, or a dash when the account has nothing in that column. */
    const amountOrDash = (value: number, visible = true) => (visible && value > 0 ? formatRupiah(value) : '-');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Neraca Saldo (Trial Balance)" />

            <PageShell className="print:p-0">
                <ReportToolbar title="Neraca Saldo" description="Ringkasan saldo awal, mutasi berjalan, dan saldo akhir untuk setiap akun." />

                {(localError || (errors && errors.start_date)) && (
                    <Alert variant="destructive" className="print:hidden">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Kesalahan</AlertTitle>
                        <AlertDescription>{localError || (errors.start_date as string)}</AlertDescription>
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

                <TableContainer className="print:rounded-none print:border-none print:shadow-none">
                    <header className="space-y-1 border-b px-4 py-4 text-center sm:px-6">
                        <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Assetory</p>
                        <h2 className="text-foreground text-xl font-bold tracking-tight">Neraca Saldo (Trial Balance)</h2>
                        <p className="text-muted-foreground text-sm">Periode {formatDateRange(filters.start_date, filters.end_date)}</p>
                    </header>

                    <Table minWidth="min-w-[1400px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={`w-40 ${GROUP_DIVIDER}`} rowSpan={2}>
                                    Kode Akun
                                </TableHead>
                                <TableHead className={`min-w-[220px] ${GROUP_DIVIDER}`} rowSpan={2}>
                                    Nama Akun
                                </TableHead>
                                <TableHead align="center" className={GROUP_DIVIDER} colSpan={2}>
                                    Saldo Awal
                                </TableHead>
                                <TableHead align="center" className={GROUP_DIVIDER} colSpan={2}>
                                    Mutasi
                                </TableHead>
                                <TableHead align="center" className={GROUP_DIVIDER} colSpan={2}>
                                    Saldo Akhir
                                </TableHead>
                                <TableHead align="center" className={GROUP_DIVIDER} colSpan={2}>
                                    Laba Rugi
                                </TableHead>
                                <TableHead align="center" colSpan={2}>
                                    Posisi Keuangan
                                </TableHead>
                            </TableRow>
                            <TableRow className="hover:bg-transparent">
                                <TableHead align="right" className="w-32 py-2">
                                    Debit
                                </TableHead>
                                <TableHead align="right" className={`w-32 py-2 ${GROUP_DIVIDER}`}>
                                    Kredit
                                </TableHead>
                                <TableHead align="right" className="w-32 py-2">
                                    Debit
                                </TableHead>
                                <TableHead align="right" className={`w-32 py-2 ${GROUP_DIVIDER}`}>
                                    Kredit
                                </TableHead>
                                <TableHead align="right" className="w-32 py-2">
                                    Debit
                                </TableHead>
                                <TableHead align="right" className={`w-32 py-2 ${GROUP_DIVIDER}`}>
                                    Kredit
                                </TableHead>
                                <TableHead align="right" className="w-32 py-2">
                                    Debit
                                </TableHead>
                                <TableHead align="right" className={`w-32 py-2 ${GROUP_DIVIDER}`}>
                                    Kredit
                                </TableHead>
                                <TableHead align="right" className="w-32 py-2">
                                    Debit
                                </TableHead>
                                <TableHead align="right" className="w-32 py-2">
                                    Kredit
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coas.length === 0 ? (
                                <TableEmpty colSpan={12} description="Tidak ada transaksi pada periode ini." />
                            ) : (
                                coas.map((coa) => {
                                    const isLr = coa.jenis_laporan === 'LR';
                                    const isLpk = coa.jenis_laporan === 'LPK';

                                    return (
                                        <TableRow key={coa.id}>
                                            <TableCell className={`text-foreground font-mono font-medium ${GROUP_DIVIDER}`}>
                                                {coa.kode_akun}
                                            </TableCell>
                                            <TableCell className={`font-medium ${GROUP_DIVIDER}`}>{coa.nama_akun}</TableCell>

                                            {/* Saldo Awal */}
                                            <TableCell numeric className="text-muted-foreground">
                                                {amountOrDash(coa.saldo_awal_debit)}
                                            </TableCell>
                                            <TableCell numeric className={`text-muted-foreground ${GROUP_DIVIDER}`}>
                                                {amountOrDash(coa.saldo_awal_kredit)}
                                            </TableCell>

                                            {/* Mutasi */}
                                            <TableCell numeric>{amountOrDash(coa.mutasi_debit)}</TableCell>
                                            <TableCell numeric className={GROUP_DIVIDER}>
                                                {amountOrDash(coa.mutasi_kredit)}
                                            </TableCell>

                                            {/* Saldo Akhir */}
                                            <TableCell numeric className="text-foreground font-semibold">
                                                {amountOrDash(coa.saldo_akhir_debit)}
                                            </TableCell>
                                            <TableCell numeric className={`text-foreground font-semibold ${GROUP_DIVIDER}`}>
                                                {amountOrDash(coa.saldo_akhir_kredit)}
                                            </TableCell>

                                            {/* Laba Rugi */}
                                            <TableCell numeric className="text-foreground">
                                                {amountOrDash(coa.saldo_akhir_debit, isLr)}
                                            </TableCell>
                                            <TableCell numeric className={`text-foreground ${GROUP_DIVIDER}`}>
                                                {amountOrDash(coa.saldo_akhir_kredit, isLr)}
                                            </TableCell>

                                            {/* Posisi Keuangan */}
                                            <TableCell numeric className="text-foreground">
                                                {amountOrDash(coa.saldo_akhir_debit, isLpk)}
                                            </TableCell>
                                            <TableCell numeric className="text-foreground">
                                                {amountOrDash(coa.saldo_akhir_kredit, isLpk)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                        <TableFooter>
                            {/* Total sebelum laba/rugi bersih */}
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={2} className={`text-xs tracking-wide uppercase ${GROUP_DIVIDER}`}>
                                    Total Sebelum Laba/Rugi
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalAwalDebit)}</TableCell>
                                <TableCell numeric className={GROUP_DIVIDER}>
                                    {formatRupiah(totalAwalKredit)}
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalMutasiDebit)}</TableCell>
                                <TableCell numeric className={GROUP_DIVIDER}>
                                    {formatRupiah(totalMutasiKredit)}
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalAkhirDebit)}</TableCell>
                                <TableCell numeric className={GROUP_DIVIDER}>
                                    {formatRupiah(totalAkhirKredit)}
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalLrDebit)}</TableCell>
                                <TableCell numeric className={GROUP_DIVIDER}>
                                    {formatRupiah(totalLrKredit)}
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalLpkDebit)}</TableCell>
                                <TableCell numeric>{formatRupiah(totalLpkKredit)}</TableCell>
                            </TableRow>

                            {/* Laba/rugi bersih */}
                            <TableRow className="bg-emerald-500/5 hover:bg-emerald-500/5">
                                <TableCell
                                    colSpan={2}
                                    className={`text-xs tracking-wide text-emerald-600 uppercase dark:text-emerald-400 ${GROUP_DIVIDER}`}
                                >
                                    {netIncome >= 0 ? 'Laba Bersih Tahun Berjalan' : 'Rugi Bersih Tahun Berjalan'}
                                </TableCell>
                                <TableCell numeric className="text-muted-foreground">
                                    -
                                </TableCell>
                                <TableCell numeric className={`text-muted-foreground ${GROUP_DIVIDER}`}>
                                    -
                                </TableCell>
                                <TableCell numeric className="text-muted-foreground">
                                    -
                                </TableCell>
                                <TableCell numeric className={`text-muted-foreground ${GROUP_DIVIDER}`}>
                                    -
                                </TableCell>
                                <TableCell numeric className="text-muted-foreground">
                                    -
                                </TableCell>
                                <TableCell numeric className={`text-muted-foreground ${GROUP_DIVIDER}`}>
                                    -
                                </TableCell>
                                <TableCell numeric className="text-emerald-600 dark:text-emerald-400">
                                    {netIncome >= 0 ? formatRupiah(netIncome) : '-'}
                                </TableCell>
                                <TableCell numeric className={`text-emerald-600 dark:text-emerald-400 ${GROUP_DIVIDER}`}>
                                    {netIncome < 0 ? formatRupiah(Math.abs(netIncome)) : '-'}
                                </TableCell>
                                <TableCell numeric className="text-emerald-600 dark:text-emerald-400">
                                    {netIncome < 0 ? formatRupiah(Math.abs(netIncome)) : '-'}
                                </TableCell>
                                <TableCell numeric className="text-emerald-600 dark:text-emerald-400">
                                    {netIncome >= 0 ? formatRupiah(netIncome) : '-'}
                                </TableCell>
                            </TableRow>

                            {/* Total akhir */}
                            <TableRow className="bg-muted hover:bg-muted border-t-2">
                                <TableCell colSpan={2} className={`text-sm tracking-wide uppercase ${GROUP_DIVIDER}`}>
                                    Total Akhir
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalAwalDebit)}</TableCell>
                                <TableCell numeric className={GROUP_DIVIDER}>
                                    {formatRupiah(totalAwalKredit)}
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalMutasiDebit)}</TableCell>
                                <TableCell numeric className={GROUP_DIVIDER}>
                                    {formatRupiah(totalMutasiKredit)}
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalAkhirDebit)}</TableCell>
                                <TableCell numeric className={GROUP_DIVIDER}>
                                    {formatRupiah(totalAkhirKredit)}
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalLrDebit + (netIncome >= 0 ? netIncome : 0))}</TableCell>
                                <TableCell numeric className={GROUP_DIVIDER}>
                                    {formatRupiah(totalLrKredit + (netIncome < 0 ? Math.abs(netIncome) : 0))}
                                </TableCell>
                                <TableCell numeric>{formatRupiah(totalLpkDebit + (netIncome < 0 ? Math.abs(netIncome) : 0))}</TableCell>
                                <TableCell numeric>{formatRupiah(totalLpkKredit + (netIncome >= 0 ? netIncome : 0))}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>

                {/* Balance verification */}
                {difference > 0.01 && (
                    <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-3 rounded-lg border p-4 text-sm font-medium print:hidden">
                        <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
                        <span>
                            Peringatan: neraca saldo akhir tidak seimbang. Selisih sebesar{' '}
                            <span className="font-mono tabular-nums">{formatRupiah(difference)}</span>.
                        </span>
                    </div>
                )}
            </PageShell>
        </AppLayout>
    );
}
