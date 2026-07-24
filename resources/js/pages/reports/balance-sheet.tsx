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
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                        {/* ASSETS COLUMN */}
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

                        {/* LIABILITIES AND EQUITY COLUMN */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <ReportSection title="2. Kewajiban (Utang)">
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

                            <div className="space-y-3">
                                <ReportSection title="3. Ekuitas (Modal)">
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
