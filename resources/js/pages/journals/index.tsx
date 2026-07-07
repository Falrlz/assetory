import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type Asset, type BreadcrumbItem, type Coa, type Journal } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, Calculator, Calendar, FileText, Landmark, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jurnal & Buku Besar',
        href: '/journals',
    },
];

interface JournalItemProp {
    id: number;
    coa_id: number;
    debit: number;
    kredit: number;
    tanggal: string;
    nomor_jurnal: string;
    keterangan: string;
    saldo_berjalan?: number;
}

interface IndexProps {
    journals: Journal[];
    coas: Coa[];
    ledgerCoa: Coa | null;
    ledgerItems: JournalItemProp[];
    postedMonths: string[];
    assets: Asset[];
}

const TIPE_JURNAL_LABELS: Record<string, string> = {
    umum: 'Jurnal Umum',
    perolehan_aset: 'Perolehan Aset',
    penyusutan: 'Penyusutan Aset',
};

const KATEGORI_LABELS: Record<string, string> = {
    aset: 'Aset / Harta',
    kewajiban: 'Kewajiban / Utang',
    ekuitas: 'Ekuitas / Modal',
    pendapatan: 'Pendapatan',
    beban: 'Beban',
};

export default function Index({ journals, coas, ledgerCoa, ledgerItems, postedMonths, assets }: IndexProps) {
    const [activeTab, setActiveTab] = useState<'umum' | 'ledger' | 'depresiasi'>('umum');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCoaId, setSelectedCoaId] = useState<string>(ledgerCoa?.id.toString() || '');

    // Default select current month (YYYY-MM)
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

    // Form for manual journal entry
    const { data, setData, post, processing, errors, reset } = useForm({
        tanggal: today.toISOString().split('T')[0],
        keterangan: '',
        items: [
            { coa_id: '', debit: 0, kredit: 0 },
            { coa_id: '', debit: 0, kredit: 0 },
        ],
    });

    // Form for monthly depreciation posting
    const depForm = useForm({
        bulan: currentMonthStr,
    });

    // Auto-update query when changing General Ledger COA
    const handleCoaChange = (coaId: string) => {
        setSelectedCoaId(coaId);
        if (coaId) {
            router.get(
                route('journals.index'),
                { coa_id: coaId },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => setActiveTab('ledger'),
                },
            );
        } else {
            router.get(
                route('journals.index'),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => setActiveTab('ledger'),
                },
            );
        }
    };

    // Calculate dynamic balance for the manual form entry
    const totalDebit = data.items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
    const totalKredit = data.items.reduce((sum, item) => sum + (Number(item.kredit) || 0), 0);
    const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalKredit) < 0.01;

    const handleAddItemRow = () => {
        setData('items', [...data.items, { coa_id: '', debit: 0, kredit: 0 }]);
    };

    const handleRemoveItemRow = (index: number) => {
        if (data.items.length <= 2) return;
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const handleItemChange = (index: number, field: 'coa_id' | 'debit' | 'kredit', value: string) => {
        const newItems = [...data.items];
        if (field === 'coa_id') {
            newItems[index].coa_id = value;
        } else {
            const numericValue = value === '' ? 0 : parseFloat(value) || 0;
            newItems[index][field] = numericValue;
        }
        setData('items', newItems);
    };

    const handleSubmitJournal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) return;

        post(route('journals.store'), {
            onSuccess: () => {
                setIsOpen(false);
                reset();
            },
        });
    };

    const handleDeleteJournal = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus jurnal ini? Tindakan ini akan menghapus detail debit dan kredit secara permanen.')) {
            router.delete(route('journals.destroy', id));
        }
    };

    const handlePostDepreciation = (e: React.FormEvent) => {
        e.preventDefault();
        depForm.setData('bulan', selectedMonth);

        router.post(
            route('journals.depreciation'),
            {
                bulan: selectedMonth,
            },
            {
                onSuccess: () => {
                    alert('Jurnal penyusutan bulanan berhasil diposting!');
                },
                onError: (err) => {
                    alert(err.bulan || 'Terjadi kesalahan saat memposting jurnal penyusutan.');
                },
            },
        );
    };

    // Calculate active assets list for the selected month preview
    const getAssetsForMonth = (monthStr: string) => {
        if (!monthStr) return [];
        const [year, month] = monthStr.split('-').map(Number);
        const targetDate = new Date(year, month, 0); // End of target month

        return assets.filter((asset) => {
            const perolehan = new Date(asset.tanggal_perolehan);
            if (perolehan > targetDate) return false;

            const diffInMonths = (targetDate.getFullYear() - perolehan.getFullYear()) * 12 + (targetDate.getMonth() - perolehan.getMonth());
            const maxMonths =
                {
                    periode_1: 48,
                    periode_2: 96,
                    periode_3: 192,
                    periode_4: 240,
                }[asset.periode] || 48;

            return diffInMonths < maxMonths;
        });
    };

    const previewAssets = getAssetsForMonth(selectedMonth);
    const totalMonthDepreciation = previewAssets.reduce((sum, asset) => sum + Number(asset.penyusutan_bulanan), 0);
    const isMonthAlreadyPosted = postedMonths.includes(selectedMonth);

    // Helper formatting currency IDR
    const formatIDR = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
        }).format(num || 0);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jurnal & Buku Besar" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Jurnal & Buku Besar</h1>
                        <p className="text-muted-foreground text-sm">
                            Pencatatan akuntansi double-entry, buku besar pembantu, dan posting otomatis depresiasi aset.
                        </p>
                    </div>
                    {activeTab === 'umum' && (
                        <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Jurnal Manual
                        </Button>
                    )}
                </div>

                {/* Tab Header Navigation */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('umum')}
                        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'umum' ? 'border-primary text-foreground' : 'text-muted-foreground hover:text-foreground border-transparent'
                        }`}
                    >
                        Jurnal Umum
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'ledger'
                                ? 'border-primary text-foreground'
                                : 'text-muted-foreground hover:text-foreground border-transparent'
                        }`}
                    >
                        Buku Besar (Ledger)
                    </button>
                    <button
                        onClick={() => setActiveTab('depresiasi')}
                        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'depresiasi'
                                ? 'border-primary text-foreground'
                                : 'text-muted-foreground hover:text-foreground border-transparent'
                        }`}
                    >
                        Penyusutan Bulanan
                    </button>
                </div>

                {/* TAB CONTENT: JURNAL UMUM */}
                {activeTab === 'umum' && (
                    <div className="space-y-6">
                        {journals.length === 0 ? (
                            <div className="bg-card flex flex-col items-center justify-center rounded-xl border py-16 text-center">
                                <FileText className="text-muted-foreground/50 mb-3 h-10 w-10" />
                                <h3 className="text-base font-semibold">Belum Ada Transaksi Jurnal</h3>
                                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                                    Mulai catat transaksi manual Anda atau buat aset tetap untuk memicu jurnal otomatis.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {journals.map((journal) => (
                                    <div key={journal.id} className="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-xs">
                                        {/* Header Jurnal */}
                                        <div className="bg-muted/30 flex flex-col justify-between gap-2 border-b p-4 sm:flex-row">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="text-foreground font-mono text-base font-bold">{journal.nomor_jurnal}</span>
                                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(journal.tanggal).toLocaleDateString('id-ID', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                        journal.tipe_jurnal === 'penyusutan'
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : journal.tipe_jurnal === 'perolehan_aset'
                                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                              : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {TIPE_JURNAL_LABELS[journal.tipe_jurnal]}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-muted-foreground line-clamp-1 max-w-md text-sm italic">{journal.keterangan}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-auto h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                                    onClick={() => handleDeleteJournal(journal.id)}
                                                    title="Hapus Jurnal"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Items Jurnal */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-muted/10 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                                                        <th className="px-6 py-2.5 text-left">Akun</th>
                                                        <th className="w-1/4 px-6 py-2.5 text-right">Debit</th>
                                                        <th className="w-1/4 px-6 py-2.5 text-right">Kredit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {journal.items?.map((item) => (
                                                        <tr key={item.id} className="hover:bg-muted/10">
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-muted-foreground w-16 font-mono text-xs">
                                                                        {item.coa?.kode_akun}
                                                                    </span>
                                                                    <span
                                                                        className={`font-medium ${Number(item.kredit) > 0 ? 'text-muted-foreground pl-8' : 'text-foreground'}`}
                                                                    >
                                                                        {item.coa?.nama_akun}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono">
                                                                {Number(item.debit) > 0 ? formatIDR(item.debit) : '-'}
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono">
                                                                {Number(item.kredit) > 0 ? formatIDR(item.kredit) : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: BUKU BESAR (LEDGER) */}
                {activeTab === 'ledger' && (
                    <div className="space-y-6">
                        {/* Selector COA */}
                        <div className="bg-card flex max-w-md flex-col gap-2 rounded-xl border p-4">
                            <Label htmlFor="ledger_coa">Pilih Akun Buku Besar</Label>
                            <select
                                id="ledger_coa"
                                className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                value={selectedCoaId}
                                onChange={(e) => handleCoaChange(e.target.value)}
                            >
                                <option value="">-- Pilih Akun --</option>
                                {coas.map((coa) => (
                                    <option key={coa.id} value={coa.id}>
                                        [{coa.kode_akun}] {coa.nama_akun} ({KATEGORI_LABELS[coa.kategori]})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Detail Buku Besar */}
                        {!ledgerCoa ? (
                            <div className="bg-card flex flex-col items-center justify-center rounded-xl border py-16 text-center">
                                <Landmark className="text-muted-foreground/50 mb-3 h-10 w-10" />
                                <h3 className="text-base font-semibold">Tampilkan Buku Besar</h3>
                                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                                    Pilih akun dari dropdown di atas untuk melihat mutasi historis saldo dan riwayat debit/kredit.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-muted/20 flex flex-col items-start justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="text-foreground text-lg font-bold">
                                            [{ledgerCoa.kode_akun}] {ledgerCoa.nama_akun}
                                        </h3>
                                        <p className="text-muted-foreground text-xs">
                                            Kategori: <span className="capitalize">{KATEGORI_LABELS[ledgerCoa.kategori]}</span> | Saldo Normal:{' '}
                                            <span className="capitalize">{ledgerCoa.saldo_normal}</span>
                                        </p>
                                    </div>
                                    <div className="bg-card rounded-lg border px-4 py-2">
                                        <span className="text-muted-foreground block text-xs">Saldo Akhir</span>
                                        <span className="text-foreground font-mono text-lg font-bold">
                                            {formatIDR(ledgerItems.length > 0 ? ledgerItems[ledgerItems.length - 1].saldo_berjalan || 0 : 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-card w-full overflow-hidden rounded-xl border shadow-xs">
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                                            <thead>
                                                <tr className="bg-muted/40 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                                                    <th className="w-32 px-6 py-4">Tanggal</th>
                                                    <th className="w-40 px-6 py-4">No. Jurnal</th>
                                                    <th className="px-6 py-4">Keterangan</th>
                                                    <th className="w-40 px-6 py-4 text-right">Debit</th>
                                                    <th className="w-40 px-6 py-4 text-right">Kredit</th>
                                                    <th className="w-44 px-6 py-4 text-right">Saldo Berjalan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y font-mono">
                                                {ledgerItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="text-muted-foreground px-6 py-12 text-center font-sans">
                                                            Belum ada mutasi transaksi untuk akun ini.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    ledgerItems.map((item) => {
                                                        const isDeb = Number(item.debit) > 0;
                                                        const isKred = Number(item.kredit) > 0;
                                                        return (
                                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                                <td className="text-muted-foreground px-6 py-4 font-sans">
                                                                    {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                                                </td>
                                                                <td className="text-foreground px-6 py-4 font-bold">{item.nomor_jurnal}</td>
                                                                <td
                                                                    className="text-foreground max-w-xs truncate px-6 py-4 font-sans"
                                                                    title={item.keterangan}
                                                                >
                                                                    {item.keterangan}
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">
                                                                    {isDeb ? formatIDR(item.debit) : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">
                                                                    {isKred ? formatIDR(item.kredit) : '-'}
                                                                </td>
                                                                <td className="text-foreground px-6 py-4 text-right font-bold">
                                                                    {formatIDR(item.saldo_berjalan || 0)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: PENYUSUTAN BULANAN */}
                {activeTab === 'depresiasi' && (
                    <div className="space-y-6">
                        {/* Selector Month */}
                        <div className="bg-card grid max-w-2xl items-end gap-4 rounded-xl border p-5 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="dep_month">Pilih Bulan Penyusutan</Label>
                                <Input id="dep_month" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                            </div>
                            <div className="flex items-center">
                                {isMonthAlreadyPosted ? (
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800 dark:border-green-800/30 dark:bg-green-900/30 dark:text-green-400">
                                        <ShieldCheck className="h-4 w-4" />
                                        Sudah Diposting ke Jurnal
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-400">
                                        <AlertCircle className="h-4 w-4" />
                                        Belum Diposting ke Jurnal
                                    </div>
                                )}
                            </div>
                            <div>
                                <Button
                                    onClick={handlePostDepreciation}
                                    disabled={isMonthAlreadyPosted || previewAssets.length === 0}
                                    className="w-full"
                                >
                                    <Calculator className="mr-2 h-4 w-4" />
                                    Posting Jurnal
                                </Button>
                            </div>
                        </div>

                        {/* Estimasi Aset yg Disusutkan */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">Rincian Penyusutan Aset</h3>
                                <div className="text-right">
                                    <span className="text-muted-foreground block text-xs">Total Estimasi Penyusutan</span>
                                    <span className="text-foreground font-mono text-base font-bold">{formatIDR(totalMonthDepreciation)}</span>
                                </div>
                            </div>

                            <div className="bg-card w-full overflow-hidden rounded-xl border shadow-xs">
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="bg-muted/40 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                                                <th className="px-6 py-4">Nama Aset</th>
                                                <th className="w-32 px-6 py-4">Jenis</th>
                                                <th className="w-40 px-6 py-4 text-center">Tanggal Perolehan</th>
                                                <th className="w-44 px-6 py-4 text-right">Harga Perolehan</th>
                                                <th className="w-44 px-6 py-4 text-right">Beban Penyusutan / Bulan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {previewAssets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-muted-foreground px-6 py-12 text-center">
                                                        Tidak ada aset aktif yang menyusut pada bulan terpilih.
                                                    </td>
                                                </tr>
                                            ) : (
                                                previewAssets.map((asset) => (
                                                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="text-foreground px-6 py-4 font-semibold">{asset.nama}</td>
                                                        <td className="text-muted-foreground px-6 py-4 capitalize">{asset.jenis}</td>
                                                        <td className="text-muted-foreground px-6 py-4 text-center font-mono">
                                                            {new Date(asset.tanggal_perolehan).toLocaleDateString('id-ID')}
                                                        </td>
                                                        <td className="text-foreground px-6 py-4 text-right font-mono">
                                                            {formatIDR(asset.harga_perolehan)}
                                                        </td>
                                                        <td className="text-foreground px-6 py-4 text-right font-mono font-bold">
                                                            {formatIDR(asset.penyusutan_bulanan)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* DIALOG FORM: CREATE MANUAL JOURNAL */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
                    <form onSubmit={handleSubmitJournal}>
                        <DialogHeader>
                            <DialogTitle>Buat Jurnal Manual Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan detail transaksi keuangan. Pastikan jumlah debit dan kredit seimbang (balance).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Row 1: Tanggal & Keterangan */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="tanggal">Tanggal</Label>
                                    <Input
                                        id="tanggal"
                                        type="date"
                                        value={data.tanggal}
                                        onChange={(e) => setData('tanggal', e.target.value)}
                                        required
                                    />
                                    {errors.tanggal && <span className="text-xs text-red-500">{errors.tanggal}</span>}
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="keterangan">Keterangan / Deskripsi</Label>
                                    <Input
                                        id="keterangan"
                                        placeholder="Contoh: Pembayaran sewa gedung kantor"
                                        value={data.keterangan}
                                        onChange={(e) => setData('keterangan', e.target.value)}
                                        required
                                    />
                                    {errors.keterangan && <span className="text-xs text-red-500">{errors.keterangan}</span>}
                                </div>
                            </div>

                            {/* Baris Debit/Kredit Dinamis */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Baris Posting Jurnal</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow}>
                                        Tambah Baris
                                    </Button>
                                </div>

                                {errors.items && (
                                    <div className="rounded-lg border bg-red-50 p-2 text-xs font-semibold text-red-500">{errors.items}</div>
                                )}

                                <div className="space-y-2.5">
                                    {data.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            {/* COA SELECT */}
                                            <div className="flex-1">
                                                <select
                                                    value={item.coa_id}
                                                    onChange={(e) => handleItemChange(index, 'coa_id', e.target.value)}
                                                    className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:outline-hidden"
                                                    required
                                                >
                                                    <option value="">-- Pilih Akun --</option>
                                                    {coas.map((coa) => (
                                                        <option key={coa.id} value={coa.id}>
                                                            [{coa.kode_akun}] {coa.nama_akun}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* DEBIT INPUT */}
                                            <div className="w-1/4">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Debit (Rp)"
                                                    className="h-9 font-mono"
                                                    value={item.debit || ''}
                                                    onChange={(e) => handleItemChange(index, 'debit', e.target.value)}
                                                    disabled={Number(item.kredit) > 0}
                                                />
                                            </div>

                                            {/* KREDIT INPUT */}
                                            <div className="w-1/4">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Kredit (Rp)"
                                                    className="h-9 font-mono"
                                                    value={item.kredit || ''}
                                                    onChange={(e) => handleItemChange(index, 'kredit', e.target.value)}
                                                    disabled={Number(item.debit) > 0}
                                                />
                                            </div>

                                            {/* REMOVE BUTTON */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground h-9 w-9 hover:text-red-500 disabled:opacity-20"
                                                disabled={data.items.length <= 2}
                                                onClick={() => handleRemoveItemRow(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary & Balance Check */}
                            <div className="bg-muted/40 mt-2 flex items-center justify-between rounded-lg border p-3">
                                <div className="flex gap-4">
                                    <div className="text-muted-foreground text-xs">
                                        Total Debit:{' '}
                                        <span className="text-foreground block font-mono text-sm font-bold">{formatIDR(totalDebit)}</span>
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        Total Kredit:{' '}
                                        <span className="text-foreground block font-mono text-sm font-bold">{formatIDR(totalKredit)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {isBalanced ? (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Seimbang (Balanced)
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                            Tidak Seimbang
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsOpen(false);
                                    reset();
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing || !isBalanced}>
                                Simpan Jurnal
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
