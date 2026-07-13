import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Coa } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Calendar, CheckCircle2, RefreshCw, Save, Scale, Search } from 'lucide-react';
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    aset: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20' },
    kewajiban: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20' },
    ekuitas: { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-500/20' },
    pendapatan: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20' },
    beban: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20' },
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
                coa.nama_akun.toLowerCase().includes(searchQuery.toLowerCase()) ||
                coa.kode_akun.toLowerCase().includes(searchQuery.toLowerCase());
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
            
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Saldo Awal</h1>
                    <p className="text-muted-foreground text-sm">
                        Atur neraca saldo awal akun Chart of Accounts (COA) sebelum memulai pembukuan transaksi.
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* Top Info & Date Config */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Konfigurasi & Ringkasan</CardTitle>
                            <CardDescription>Atur tanggal efektif saldo awal dan pastikan neraca saldo seimbang.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Date Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal" className="flex items-center gap-2">
                                        <Calendar className="size-4 text-muted-foreground" />
                                        Tanggal Saldo Awal
                                    </Label>
                                    <Input
                                        id="tanggal"
                                        type="date"
                                        value={data.tanggal}
                                        onChange={(e) => setData('tanggal', e.target.value)}
                                        className="w-full"
                                        required
                                    />
                                    {errors.tanggal && <p className="text-destructive text-xs">{errors.tanggal}</p>}
                                </div>

                                {/* Sum Cards */}
                                <div className="rounded-lg border p-4 bg-muted/40">
                                    <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Debit</div>
                                    <div className="mt-1 text-xl font-bold font-mono">{formatRupiah(totalDebit)}</div>
                                </div>

                                <div className="rounded-lg border p-4 bg-muted/40">
                                    <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Kredit</div>
                                    <div className="mt-1 text-xl font-bold font-mono">{formatRupiah(totalKredit)}</div>
                                </div>
                            </div>

                            {/* Balance Indicator Status */}
                            <div className="mt-6">
                                {!hasAnyBalance ? (
                                    <Alert className="bg-muted text-muted-foreground border-neutral-200">
                                        <Scale className="size-4" />
                                        <AlertTitle>Belum ada Saldo Awal</AlertTitle>
                                        <AlertDescription>
                                            Masukkan nilai debit atau kredit pada daftar akun di bawah untuk memulai.
                                        </AlertDescription>
                                    </Alert>
                                ) : isBalanced ? (
                                    <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-600">
                                        <CheckCircle2 className="size-4" />
                                        <AlertTitle>Neraca Seimbang</AlertTitle>
                                        <AlertDescription>
                                            Total debit dan total kredit seimbang. Anda dapat menyimpan saldo awal ini.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 [&>svg]:text-destructive">
                                        <AlertTriangle className="size-4" />
                                        <AlertTitle>Neraca Tidak Seimbang!</AlertTitle>
                                        <AlertDescription>
                                            Terdapat selisih sebesar <span className="font-bold font-mono">{formatRupiah(difference)}</span>. 
                                            Neraca saldo awal harus seimbang (selisih Rp0) agar dapat disimpan.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {errors.balances && (
                                    <p className="text-destructive text-sm mt-2 font-medium">{errors.balances}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filters & Account List */}
                    <Card className="flex-1">
                        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">Daftar Akun Transaksi</CardTitle>
                                <CardDescription>Masukkan saldo awal berdasarkan saldo normal masing-masing akun.</CardDescription>
                            </div>
                            
                            {/* Search bar */}
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari kode atau nama akun..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Category Tabs */}
                            <div className="flex border-b overflow-x-auto px-6 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('all')}
                                    className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                        selectedCategory === 'all'
                                            ? 'border-primary text-foreground'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Semua Akun
                                </button>
                                {Object.keys(CATEGORY_LABELS).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                            selectedCategory === cat
                                                ? 'border-primary text-foreground'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {CATEGORY_LABELS[cat]}
                                    </button>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                                            <th className="px-6 py-3 w-40">Kode Akun</th>
                                            <th className="px-6 py-3">Nama Akun</th>
                                            <th className="px-6 py-3 w-32">Kategori</th>
                                            <th className="px-6 py-3 w-32">Saldo Normal</th>
                                            <th className="px-6 py-3 w-52 text-right">Debit</th>
                                            <th className="px-6 py-3 w-52 text-right">Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredCoas.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada akun yang cocok dengan filter atau pencarian Anda.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCoas.map((coa) => {
                                                const currentVal = balanceLookup[coa.id] || { debit: 0, kredit: 0 };
                                                const catColor = CATEGORY_COLORS[coa.kategori] || { bg: '', text: '', border: '' };

                                                return (
                                                    <tr key={coa.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-6 py-3.5 font-mono font-medium">{coa.kode_akun}</td>
                                                        <td className="px-6 py-3.5 font-medium">{coa.nama_akun}</td>
                                                        <td className="px-6 py-3.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                                                                {coa.kategori}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3.5 capitalize text-muted-foreground">{coa.saldo_normal}</td>
                                                        
                                                        {/* Debit Input */}
                                                        <td className="px-6 py-2">
                                                            <div className="relative flex items-center justify-end">
                                                                <span className="absolute left-3 text-xs text-muted-foreground pointer-events-none">Rp</span>
                                                                <Input
                                                                    type="number"
                                                                    value={currentVal.debit || ''}
                                                                    onChange={(e) => handleBalanceChange(coa.id, 'debit', e.target.value)}
                                                                    disabled={currentVal.kredit > 0}
                                                                    placeholder="0"
                                                                    className="w-full text-right font-mono text-sm pl-8 max-w-[180px] disabled:bg-muted/50 disabled:opacity-50"
                                                                    min="0"
                                                                    step="any"
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Kredit Input */}
                                                        <td className="px-6 py-2">
                                                            <div className="relative flex items-center justify-end">
                                                                <span className="absolute left-3 text-xs text-muted-foreground pointer-events-none">Rp</span>
                                                                <Input
                                                                    type="number"
                                                                    value={currentVal.kredit || ''}
                                                                    onChange={(e) => handleBalanceChange(coa.id, 'kredit', e.target.value)}
                                                                    disabled={currentVal.debit > 0}
                                                                    placeholder="0"
                                                                    className="w-full text-right font-mono text-sm pl-8 max-w-[180px] disabled:bg-muted/50 disabled:opacity-50"
                                                                    min="0"
                                                                    step="any"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between border-t p-6 bg-muted/20">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleResetAll}
                                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <RefreshCw className="size-4" />
                                    Kosongkan Saldo
                                </Button>

                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        disabled={processing || (!isBalanced && hasAnyBalance)}
                                        className="gap-2"
                                    >
                                        <Save className="size-4" />
                                        Simpan Saldo Awal
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
