import { Field, PageHeader, PageShell } from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type Coa } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, RefreshCw, Save, Scale, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Saldo Awal',
        href: '/beginning-balances',
    },
];

interface BeginningBalanceProps {
    coas: (Coa & { debit: number; kredit: number })[];
    openingDate: string;
}

const CATEGORY_TONES: Record<string, BadgeProps['variant']> = {
    aset: 'success',
    kewajiban: 'info',
    ekuitas: 'accent',
    pendapatan: 'warning',
    beban: 'danger',
};

const CATEGORY_LABELS: Record<string, string> = {
    aset: 'Aset / Harta',
    kewajiban: 'Kewajiban / Utang',
    ekuitas: 'Ekuitas / Modal',
    pendapatan: 'Pendapatan',
    beban: 'Beban',
};

export default function BeginningBalances({ coas, openingDate }: BeginningBalanceProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { data, setData, post, processing, errors } = useForm({
        tanggal: openingDate,
        balances: coas.map((coa) => ({
            coa_id: coa.id,
            debit: coa.debit || 0,
            kredit: coa.kredit || 0,
        })),
    });

    // Lookup table for editing balances easily
    const balanceLookup = useMemo(() => {
        const lookup: Record<number, { debit: number; kredit: number; index: number }> = {};
        data.balances.forEach((item, index) => {
            lookup[item.coa_id] = {
                debit: item.debit,
                kredit: item.kredit,
                index,
            };
        });
        return lookup;
    }, [data.balances]);

    // Handle change of balance value
    const handleBalanceChange = (coaId: number, field: 'debit' | 'kredit', value: string) => {
        const numericValue = parseFloat(value) || 0;

        const newBalances = [...data.balances];
        const lookupItem = balanceLookup[coaId];

        if (lookupItem) {
            newBalances[lookupItem.index] = {
                ...newBalances[lookupItem.index],
                [field]: numericValue,
                // Enforce that only one is non-zero (debit OR credit, not both)
                ...(field === 'debit' && numericValue > 0 ? { kredit: 0 } : {}),
                ...(field === 'kredit' && numericValue > 0 ? { debit: 0 } : {}),
            };
            setData('balances', newBalances);
        }
    };

    // Reset all inputs to 0
    const handleResetAll = () => {
        if (window.confirm('Apakah Anda yakin ingin mengosongkan semua saldo awal?')) {
            setData(
                'balances',
                data.balances.map((item) => ({
                    ...item,
                    debit: 0,
                    kredit: 0,
                })),
            );
        }
    };

    // Calculate totals
    const { totalDebit, totalKredit } = useMemo(() => {
        let dr = 0;
        let cr = 0;
        data.balances.forEach((b) => {
            dr += b.debit;
            cr += b.kredit;
        });
        return { totalDebit: dr, totalKredit: cr };
    }, [data.balances]);

    const difference = Math.abs(totalDebit - totalKredit);
    const isBalanced = Math.round(totalDebit * 100) === Math.round(totalKredit * 100);
    const hasAnyBalance = totalDebit > 0 || totalKredit > 0;

    // Filter COAs based on search query and category tab
    const filteredCoas = useMemo(() => {
        return coas.filter((coa) => {
            const matchesSearch =
                coa.nama_akun.toLowerCase().includes(searchQuery.toLowerCase()) || coa.kode_akun.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || coa.kategori === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [coas, searchQuery, selectedCategory]);

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('beginning-balances.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Saldo Awal (Beginning Balances)" />

            <PageShell>
                <PageHeader
                    title="Saldo Awal"
                    description="Atur neraca saldo awal akun Chart of Accounts (COA) sebelum memulai pembukuan transaksi."
                />

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* Top Info & Date Config */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Konfigurasi &amp; Ringkasan</CardTitle>
                            <CardDescription>Atur tanggal efektif saldo awal dan pastikan neraca saldo seimbang.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field>
                                    <Label htmlFor="tanggal">Pilih Tanggal</Label>
                                    <DatePicker id="tanggal" value={data.tanggal} onChange={(val) => setData('tanggal', val)} />
                                    {errors.tanggal && <p className="text-destructive text-xs font-medium">{errors.tanggal}</p>}
                                </Field>

                                <div className="bg-muted/40 rounded-lg border p-4">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Total Debit</p>
                                    <p className="mt-1 font-mono text-xl font-bold tabular-nums">{formatRupiah(totalDebit)}</p>
                                </div>

                                <div className="bg-muted/40 rounded-lg border p-4">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Total Kredit</p>
                                    <p className="mt-1 font-mono text-xl font-bold tabular-nums">{formatRupiah(totalKredit)}</p>
                                </div>
                            </div>

                            {/* Balance Indicator Status */}
                            {!hasAnyBalance ? (
                                <Alert className="bg-muted text-muted-foreground">
                                    <Scale className="size-4" />
                                    <AlertTitle>Belum Ada Saldo Awal</AlertTitle>
                                    <AlertDescription>Masukkan nilai debit atau kredit pada daftar akun di bawah untuk memulai.</AlertDescription>
                                </Alert>
                            ) : isBalanced ? (
                                <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-600">
                                    <CheckCircle2 className="size-4" />
                                    <AlertTitle>Neraca Seimbang</AlertTitle>
                                    <AlertDescription>Total debit dan total kredit seimbang. Anda dapat menyimpan saldo awal ini.</AlertDescription>
                                </Alert>
                            ) : (
                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 [&>svg]:text-destructive">
                                    <AlertTriangle className="size-4" />
                                    <AlertTitle>Neraca Tidak Seimbang</AlertTitle>
                                    <AlertDescription>
                                        Terdapat selisih sebesar <span className="font-mono font-bold tabular-nums">{formatRupiah(difference)}</span>.
                                        Neraca saldo awal harus seimbang (selisih Rp 0) agar dapat disimpan.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {errors.balances && <p className="text-destructive text-sm font-medium">{errors.balances}</p>}
                        </CardContent>
                    </Card>

                    {/* Filters & Account List */}
                    <Card>
                        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                                <CardTitle>Daftar Akun Transaksi</CardTitle>
                                <CardDescription>Masukkan saldo awal berdasarkan saldo normal masing-masing akun.</CardDescription>
                            </div>

                            <div className="relative w-full shrink-0 md:w-80">
                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input
                                    inputSize="sm"
                                    placeholder="Cari kode atau nama akun..."
                                    aria-label="Cari kode atau nama akun"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Category Tabs */}
                            <div className="flex gap-1 overflow-x-auto border-y px-5">
                                {[['all', 'Semua Akun'], ...Object.entries(CATEGORY_LABELS)].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setSelectedCategory(value)}
                                        className={cn(
                                            'border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                                            selectedCategory === value
                                                ? 'border-primary text-foreground'
                                                : 'text-muted-foreground hover:text-foreground border-transparent',
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Table */}
                            <Table minWidth="min-w-[1000px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-44">Kode Akun</TableHead>
                                        <TableHead className="min-w-[200px]">Nama Akun</TableHead>
                                        <TableHead align="center" className="w-44">
                                            Kategori
                                        </TableHead>
                                        <TableHead align="center" className="w-36">
                                            Saldo Normal
                                        </TableHead>
                                        <TableHead align="right" className="w-56">
                                            Debit
                                        </TableHead>
                                        <TableHead align="right" className="w-56">
                                            Kredit
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCoas.length === 0 ? (
                                        <TableEmpty
                                            colSpan={6}
                                            icon={<Search className="text-muted-foreground/40 mb-1 size-10" />}
                                            title="Tidak Ada Hasil Cocok"
                                            description="Tidak ada akun yang cocok dengan filter atau pencarian Anda."
                                        />
                                    ) : (
                                        filteredCoas.map((coa) => {
                                            const currentVal = balanceLookup[coa.id] || { debit: 0, kredit: 0 };

                                            return (
                                                <TableRow key={coa.id}>
                                                    <TableCell className="text-foreground font-mono font-medium">{coa.kode_akun}</TableCell>
                                                    <TableCell className="text-foreground font-medium">{coa.nama_akun}</TableCell>
                                                    <TableCell align="center">
                                                        <Badge variant={CATEGORY_TONES[coa.kategori] ?? 'secondary'} className="capitalize">
                                                            {coa.kategori}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell align="center" className="text-muted-foreground capitalize">
                                                        {coa.saldo_normal}
                                                    </TableCell>

                                                    <TableCell className="py-2">
                                                        <div className="relative ml-auto max-w-[200px]">
                                                            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs">
                                                                Rp
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                inputSize="sm"
                                                                aria-label={`Saldo debit ${coa.nama_akun}`}
                                                                value={currentVal.debit || ''}
                                                                onChange={(e) => handleBalanceChange(coa.id, 'debit', e.target.value)}
                                                                disabled={currentVal.kredit > 0}
                                                                placeholder="0"
                                                                className="disabled:bg-muted/50 pl-9 text-right font-mono tabular-nums"
                                                                min="0"
                                                                step="any"
                                                            />
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-2">
                                                        <div className="relative ml-auto max-w-[200px]">
                                                            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs">
                                                                Rp
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                inputSize="sm"
                                                                aria-label={`Saldo kredit ${coa.nama_akun}`}
                                                                value={currentVal.kredit || ''}
                                                                onChange={(e) => handleBalanceChange(coa.id, 'kredit', e.target.value)}
                                                                disabled={currentVal.debit > 0}
                                                                placeholder="0"
                                                                className="disabled:bg-muted/50 pl-9 text-right font-mono tabular-nums"
                                                                min="0"
                                                                step="any"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            {/* Footer Actions */}
                            <div className="bg-muted/20 flex flex-wrap items-center justify-between gap-3 border-t p-5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleResetAll}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <RefreshCw />
                                    Kosongkan Saldo
                                </Button>

                                <Button type="submit" disabled={processing || (!isBalanced && hasAnyBalance)}>
                                    <Save />
                                    Simpan Saldo Awal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </PageShell>
        </AppLayout>
    );
}
