import { Field, PageShell } from '@/components/page-header';
import {
    AccountTable,
    formatDateSlash,
    ReportDocument,
    ReportFilterCard,
    ReportSection,
    ReportToolbar,
    TotalRow,
    type ReportAccount,
} from '@/components/reports/report-layout';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Posisi Keuangan',
        href: '/reports/balance-sheet',
    },
];

interface BalanceSheetProps {
    assets: ReportAccount[];
    liabilities: ReportAccount[];
    equity: ReportAccount[];
    totalAssets: number;
    totalAssetsLastYear: number;
    totalLiabilities: number;
    totalLiabilitiesLastYear: number;
    totalEquity: number;
    totalEquityLastYear: number;
    totalLiabilitiesAndEquity: number;
    totalLiabilitiesAndEquityLastYear: number;
    filters: {
        end_date: string;
    };
}

export default function BalanceSheet({
    assets,
    liabilities,
    equity,
    totalAssets,
    totalAssetsLastYear,
    totalLiabilities,
    totalLiabilitiesLastYear,
    totalEquity,
    totalEquityLastYear,
    totalLiabilitiesAndEquity,
    totalLiabilitiesAndEquityLastYear,
    filters,
}: BalanceSheetProps) {
    const [endDate, setEndDate] = useState(filters.end_date);

    const currentYear = new Date(filters.end_date).getFullYear();
    const lastYear = currentYear - 1;

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

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    const currentImbalance = Math.abs(totalAssets - totalLiabilitiesAndEquity);
    const lastYearImbalance = Math.abs(totalAssetsLastYear - totalLiabilitiesAndEquityLastYear);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Posisi Keuangan" />

            <PageShell className="print:p-0">
                <ReportToolbar
                    title="Laporan Posisi Keuangan"
                    description="Laporan posisi keuangan yang memuat aset, kewajiban, dan ekuitas organisasi Anda."
                />

                <ReportFilterCard onSubmit={handleFilter} onReset={handleReset}>
                    <Field className="w-48">
                        <Label htmlFor="end_date">Per Tanggal</Label>
                        <DatePicker id="end_date" value={endDate} onChange={setEndDate} />
                    </Field>
                </ReportFilterCard>

                <ReportDocument title="Laporan Posisi Keuangan (Neraca)" period={`Per tanggal ${formatDateSlash(filters.end_date)}`}>
                    <div className="flex flex-col space-y-8">
                        {/* 1. ASSETS SECTION */}
                        <div className="space-y-4">
                            <ReportSection title="1. Aset" description="Aset lancar dan aset tetap">
                                <AccountTable
                                    accounts={assets}
                                    currentYear={currentYear}
                                    lastYear={lastYear}
                                    emptyLabel="Tidak ada saldo aset."
                                    format={formatRupiah}
                                />
                            </ReportSection>

                            <TotalRow
                                label="Total Aset"
                                emphasis="strong"
                                current={formatRupiah(totalAssets)}
                                previous={formatRupiah(totalAssetsLastYear)}
                                currentYear={currentYear}
                                lastYear={lastYear}
                            />
                        </div>

                        {/* 2. LIABILITIES SECTION */}
                        <div className="space-y-4">
                            <ReportSection title="2. Kewajiban (Utang)" description="Kewajiban jangka pendek dan jangka panjang">
                                <AccountTable
                                    accounts={liabilities}
                                    currentYear={currentYear}
                                    lastYear={lastYear}
                                    emptyLabel="Tidak ada saldo kewajiban."
                                    format={formatRupiah}
                                />
                            </ReportSection>
                            <TotalRow
                                label="Total Kewajiban"
                                current={formatRupiah(totalLiabilities)}
                                previous={formatRupiah(totalLiabilitiesLastYear)}
                                currentYear={currentYear}
                                lastYear={lastYear}
                            />
                        </div>

                        {/* 3. EQUITY SECTION */}
                        <div className="space-y-4">
                            <ReportSection title="3. Ekuitas (Modal)" description="Modal disetor dan saldo laba ditahan">
                                <AccountTable
                                    accounts={equity}
                                    currentYear={currentYear}
                                    lastYear={lastYear}
                                    emptyLabel="Tidak ada saldo ekuitas."
                                    format={formatRupiah}
                                />
                            </ReportSection>
                            <TotalRow
                                label="Total Ekuitas"
                                current={formatRupiah(totalEquity)}
                                previous={formatRupiah(totalEquityLastYear)}
                                currentYear={currentYear}
                                lastYear={lastYear}
                            />
                        </div>

                        {/* 4. TOTAL LIABILITIES AND EQUITY */}
                        <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
                            <TotalRow
                                label="Total Kewajiban & Ekuitas"
                                emphasis="strong"
                                current={formatRupiah(totalLiabilitiesAndEquity)}
                                previous={formatRupiah(totalLiabilitiesAndEquityLastYear)}
                                currentYear={currentYear}
                                lastYear={lastYear}
                            />
                        </div>
                    </div>

                    {/* Balance Check */}
                    {(currentImbalance > 0.01 || lastYearImbalance > 0.01) && (
                        <div className="bg-destructive/10 border-destructive/20 text-destructive mt-8 flex items-start gap-3 rounded-lg border p-4 text-sm font-medium print:hidden">
                            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                            <div className="space-y-1">
                                <p>Peringatan: posisi laporan keuangan tidak seimbang.</p>
                                {currentImbalance > 0.01 && (
                                    <p>
                                        Selisih {currentYear}: <span className="font-mono tabular-nums">{formatRupiah(currentImbalance)}</span>
                                    </p>
                                )}
                                {lastYearImbalance > 0.01 && (
                                    <p>
                                        Selisih {lastYear}: <span className="font-mono tabular-nums">{formatRupiah(lastYearImbalance)}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </ReportDocument>
            </PageShell>
        </AppLayout>
    );
}
