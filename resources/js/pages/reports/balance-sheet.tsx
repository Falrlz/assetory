import { Field, PageShell } from '@/components/page-header';
import {
    AccountTable,
    ReportDocument,
    ReportFilterCard,
    ReportSection,
    ReportToolbar,
    TotalRow,
    type ReportAccount,
} from '@/components/reports/report-layout';
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
    hasAppliedFilter?: boolean;
    filters: {
        year?: string;
        end_date?: string;
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
    hasAppliedFilter = false,
    filters,
}: BalanceSheetProps) {
    const [selectedYear, setSelectedYear] = useState<string>(filters.year || '');

    const currentYearNum = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    const lastYearNum = currentYearNum - 1;

    const currentCalendarYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 7 }, (_, i) => (currentCalendarYear - 5 + i).toString());

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedYear) return;
        router.get(
            route('reports.balance-sheet'),
            {
                year: selectedYear,
            },
            {
                preserveState: true,
            },
        );
    };

    const handleReset = () => {
        setSelectedYear('');
        router.get(route('reports.balance-sheet'), {});
    };

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Posisi Keuangan (Balance Sheet)" />

            <PageShell className="print:p-0">
                <ReportToolbar
                    title="Laporan Posisi Keuangan"
                    description="Rincian posisi aset, kewajiban (liabilitas), dan ekuitas perusahaan pada akhir Tahun Buku."
                />

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
                            <span className="font-semibold">"Tampilkan Laporan"</span> untuk memuat Posisi Keuangan.
                        </p>
                    </div>
                ) : (
                    <ReportDocument
                        className="mx-auto w-full max-w-4xl print:max-w-none"
                        title="Laporan Posisi Keuangan"
                        period={`Per 31 Desember ${selectedYear}`}
                    >
                        <div className="space-y-8">
                            {/* ASET SECTION */}
                            <div className="space-y-3">
                                <ReportSection title="Aset">
                                    <AccountTable
                                        accounts={assets}
                                        currentYear={currentYearNum}
                                        lastYear={lastYearNum}
                                        emptyLabel="Tidak ada data aset."
                                        format={formatRupiah}
                                    />
                                </ReportSection>
                                <TotalRow
                                    label="Total Aset"
                                    emphasis="strong"
                                    current={formatRupiah(totalAssets)}
                                    previous={formatRupiah(totalAssetsLastYear)}
                                    currentYear={currentYearNum}
                                    lastYear={lastYearNum}
                                />
                            </div>

                            {/* LIABILITAS SECTION */}
                            <div className="space-y-3">
                                <ReportSection title="Liabilitas (Kewajiban)">
                                    <AccountTable
                                        accounts={liabilities}
                                        currentYear={currentYearNum}
                                        lastYear={lastYearNum}
                                        emptyLabel="Tidak ada data kewajiban."
                                        format={formatRupiah}
                                    />
                                </ReportSection>
                                <TotalRow
                                    label="Total Liabilitas"
                                    current={formatRupiah(totalLiabilities)}
                                    previous={formatRupiah(totalLiabilitiesLastYear)}
                                    currentYear={currentYearNum}
                                    lastYear={lastYearNum}
                                />
                            </div>

                            {/* EKUITAS SECTION */}
                            <div className="space-y-3">
                                <ReportSection title="Ekuitas (Modal)">
                                    <AccountTable
                                        accounts={equity}
                                        currentYear={currentYearNum}
                                        lastYear={lastYearNum}
                                        emptyLabel="Tidak ada data ekuitas."
                                        format={formatRupiah}
                                    />
                                </ReportSection>
                                <TotalRow
                                    label="Total Ekuitas"
                                    current={formatRupiah(totalEquity)}
                                    previous={formatRupiah(totalEquityLastYear)}
                                    currentYear={currentYearNum}
                                    lastYear={lastYearNum}
                                />
                            </div>

                            {/* GRAND TOTAL SECTION */}
                            <TotalRow
                                label="Total Liabilitas & Ekuitas"
                                emphasis="strong"
                                className="border-primary/20 bg-primary/5 text-primary"
                                current={formatRupiah(totalLiabilitiesAndEquity)}
                                previous={formatRupiah(totalLiabilitiesAndEquityLastYear)}
                                currentYear={currentYearNum}
                                lastYear={lastYearNum}
                            />
                        </div>
                    </ReportDocument>
                )}
            </PageShell>
        </AppLayout>
    );
}
