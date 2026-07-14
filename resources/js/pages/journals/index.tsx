import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type Asset, type BreadcrumbItem, type Coa, type Journal } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Calculator, FileText, Landmark, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

interface LedgerAccount {
    coa: Coa;
    saldo_awal: number;
    saldo_akhir: number;
    total_debit: number;
    total_kredit: number;
    items: JournalItemProp[];
}

interface IndexProps {
    journals: Journal[];
    coas: Coa[];
    ledgerData: LedgerAccount[];
    grandTotalDebit: number;
    grandTotalKredit: number;
    ledgerFilters?: {
        start_date: string;
        end_date: string;
    };
    postedMonths: string[];
    assets: Asset[];
}

const TIPE_JURNAL_LABELS: Record<string, string> = {
    umum: 'Jurnal Umum',
    perolehan_aset: 'Perolehan Aset',
    penyusutan: 'Penyusutan Aset',
};

export default function Index({
    journals,
    coas,
    ledgerData = [],
    grandTotalDebit = 0,
    grandTotalKredit = 0,
    ledgerFilters,
    postedMonths,
    assets,
}: IndexProps) {
    const page = usePage();
    const [activeTab, setActiveTab] = useState<'umum' | 'ledger' | 'depresiasi'>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'ledger' || tab === 'depresiasi') {
                return tab;
            }
        }
        return 'umum';
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'ledger' || tab === 'depresiasi') {
            setActiveTab(tab);
        } else {
            setActiveTab('umum');
        }
    }, [page.url]);

    const [isOpen, setIsOpen] = useState(false);
    const [ledgerStartDate, setLedgerStartDate] = useState(
        ledgerFilters?.start_date || new Date(new Date().getFullYear(), 0, 2).toISOString().split('T')[0],
    );
    const [ledgerEndDate, setLedgerEndDate] = useState(ledgerFilters?.end_date || new Date().toISOString().split('T')[0]);
    const [ledgerSearch, setLedgerSearch] = useState('');

    const dynamicBreadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Journals & Ledger',
            href: '/journals',
        },
        {
            title: activeTab === 'ledger' ? 'Buku Besar Umum' : activeTab === 'depresiasi' ? 'Penyusutan Bulanan' : 'Jurnal Umum',
            href: activeTab === 'ledger' ? '/journals?tab=ledger' : activeTab === 'depresiasi' ? '/journals?tab=depresiasi' : '/journals',
        },
    ];

    // Split coas into Parent and Transaction (Child) accounts
    const parentCoas = coas.filter((c) => c.kode_akun.split('.').length === 3);
    const transactionCoas = coas.filter((c) => c.kode_akun.split('.').length > 3);

    const groupCoasByParent = (coasList: Coa[]) => {
        const groups: Record<string, Coa[]> = {};
        coasList.forEach((coa) => {
            const parts = coa.kode_akun.split('.');
            let parentLabel = 'Lainnya';
            if (parts.length >= 3) {
                const prefix = parts.slice(0, 3).join('.');
                const parent = parentCoas.find((p) => p.kode_akun === prefix);
                if (parent) {
                    parentLabel = parent.nama_akun;
                } else {
                    parentLabel = prefix;
                }
            }
            if (!groups[parentLabel]) {
                groups[parentLabel] = [];
            }
            groups[parentLabel].push(coa);
        });
        return groups;
    };

    // Default select current month (YYYY-MM)
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

    // Search and filter states for Jurnal Umum
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJenis, setFilterJenis] = useState('all');
    const [filterTahun, setFilterTahun] = useState('all');
    const [filterBulan, setFilterBulan] = useState('all');
    const [filterTanggal, setFilterTanggal] = useState('');

    // Dynamic years list based on journal dates
    const listTahun = Array.from(
        new Set(
            journals
                .map((j) => {
                    const date = new Date(j.tanggal);
                    return isNaN(date.getTime()) ? '' : date.getFullYear().toString();
                })
                .filter(Boolean),
        ),
    ).sort((a, b) => b.localeCompare(a));

    // Dynamic journal filtering
    const filteredJournals = journals.filter((journal) => {
        const query = searchQuery.toLowerCase().trim();

        // 1. Filter Cari Nama Aset / Uraian / No. Referensi
        const matchSearch =
            !query ||
            journal.nomor_jurnal.toLowerCase().includes(query) ||
            journal.keterangan.toLowerCase().includes(query) ||
            (journal.asset && journal.asset.nama.toLowerCase().includes(query));

        // 2. Filter Jenis Aset (Inventaris/Kendaraan/Gedung)
        const matchJenis = filterJenis === 'all' || (journal.asset && journal.asset.jenis === filterJenis);

        // Date check
        const dateObj = new Date(journal.tanggal);
        const isValidDate = !isNaN(dateObj.getTime());

        // 3. Filter Tahun
        const matchTahun = filterTahun === 'all' || (isValidDate && dateObj.getFullYear().toString() === filterTahun);

        // 4. Filter Bulan
        const matchBulan = filterBulan === 'all' || (isValidDate && (dateObj.getMonth() + 1).toString().padStart(2, '0') === filterBulan);

        // 5. Filter Tanggal Spesifik
        const matchTanggal = !filterTanggal || journal.tanggal.split('T')[0] === filterTanggal;

        return matchSearch && matchJenis && matchTahun && matchBulan && matchTanggal;
    });

    const isFilterActive = searchQuery !== '' || filterJenis !== 'all' || filterTahun !== 'all' || filterBulan !== 'all' || filterTanggal !== '';

    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterJenis('all');
        setFilterTahun('all');
        setFilterBulan('all');
        setFilterTanggal('');
    };

    // Form for manual journal entry
    const { data, setData, post, processing, errors, reset } = useForm({
        tanggal: today.toISOString().split('T')[0],
        jenis_transaksi: 'jurnal_umum',
        kategori_arus_kas: 'operasional',
        kode_arus_kas: 'JU-O',
        keterangan: '',
        items: [
            { coa_id: '', debit: 0, kredit: 0 },
            { coa_id: '', debit: 0, kredit: 0 },
        ],
    });

    // Auto-update Cash Flow Code (kode_arus_kas) when transaction type or category changes
    useEffect(() => {
        const typePrefixes: Record<string, string> = {
            jurnal_umum: 'JU',
            kas_masuk: 'KM',
            kas_keluar: 'KK',
            bank_masuk: 'BM',
            bank_keluar: 'BK',
            jurnal_koreksi: 'JK',
        };
        const categorySuffixes: Record<string, string> = {
            operasional: 'O',
            investasi: 'I',
            pendanaan: 'P',
        };

        const prefix = typePrefixes[data.jenis_transaksi] || 'JU';
        const suffix = categorySuffixes[data.kategori_arus_kas] || 'O';
        setData('kode_arus_kas', `${prefix}-${suffix}`);
    }, [data.jenis_transaksi, data.kategori_arus_kas, setData]);

    // Form for monthly depreciation posting
    const depForm = useForm({
        bulan: currentMonthStr,
    });

    const handleLedgerFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('journals.index'),
            {
                tab: 'ledger',
                start_date: ledgerStartDate,
                end_date: ledgerEndDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setActiveTab('ledger'),
            },
        );
    };

    const handleLedgerFilterReset = () => {
        const start = new Date(new Date().getFullYear(), 0, 2).toISOString().split('T')[0]; // Jan 1st
        const end = new Date().toISOString().split('T')[0];
        setLedgerStartDate(start);
        setLedgerEndDate(end);
        router.get(
            route('journals.index'),
            {
                tab: 'ledger',
                start_date: start,
                end_date: end,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setActiveTab('ledger'),
            },
        );
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
        <AppLayout breadcrumbs={dynamicBreadcrumbs}>
            <Head title={activeTab === 'ledger' ? 'Buku Besar Umum' : activeTab === 'depresiasi' ? 'Penyusutan Bulanan' : 'Jurnal Umum'} />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {activeTab === 'ledger' ? 'Buku Besar Umum' : activeTab === 'depresiasi' ? 'Penyusutan Bulanan' : 'Jurnal Umum'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {activeTab === 'ledger'
                                ? 'Lihat ringkasan mutasi debit dan kredit serta saldo berjalan untuk setiap akun.'
                                : activeTab === 'depresiasi'
                                  ? 'Kelola dan lakukan posting penyusutan nilai buku aset secara berkala.'
                                  : 'Pencatatan akuntansi double-entry manual maupun otomatis.'}
                        </p>
                    </div>
                    {activeTab === 'umum' && (
                        <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Jurnal Manual
                        </Button>
                    )}
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
                            <>
                                {/* Filter Controls */}
                                <div className="bg-card grid grid-cols-1 items-end gap-4 rounded-xl border p-4 sm:grid-cols-2 md:grid-cols-5">
                                    {/* Searching */}
                                    <div className="relative grid flex-1 gap-1.5">
                                        <Label htmlFor="search">Cari Nama Aset</Label>
                                        <div className="relative">
                                            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                            <Input
                                                id="search"
                                                placeholder="Ketik nama aset..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="h-9 pl-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Filter Jenis */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="jenis_filter">Jenis Aset</Label>
                                        <select
                                            id="jenis_filter"
                                            className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                                            value={filterJenis}
                                            onChange={(e) => setFilterJenis(e.target.value)}
                                        >
                                            <option value="all">Semua Jenis</option>
                                            <option value="inventaris">Inventaris</option>
                                            <option value="kendaraan">Kendaraan</option>
                                            <option value="gedung">Gedung</option>
                                        </select>
                                    </div>

                                    {/* Filter Tahun */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="tahun_filter">Tahun Perolehan</Label>
                                        <select
                                            id="tahun_filter"
                                            className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                                            value={filterTahun}
                                            onChange={(e) => {
                                                setFilterTahun(e.target.value);
                                                setFilterTanggal('');
                                            }}
                                        >
                                            <option value="all">Semua Tahun</option>
                                            {listTahun.map((yr) => (
                                                <option key={yr} value={yr}>
                                                    {yr}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filter Bulan */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="bulan_filter">Bulan Perolehan</Label>
                                        <select
                                            id="bulan_filter"
                                            className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                                            value={filterBulan}
                                            onChange={(e) => {
                                                setFilterBulan(e.target.value);
                                                setFilterTanggal('');
                                            }}
                                        >
                                            <option value="all">Semua Bulan</option>
                                            <option value="01">Januari</option>
                                            <option value="02">Februari</option>
                                            <option value="03">Maret</option>
                                            <option value="04">April</option>
                                            <option value="05">Mei</option>
                                            <option value="06">Juni</option>
                                            <option value="07">Juli</option>
                                            <option value="08">Agustus</option>
                                            <option value="09">September</option>
                                            <option value="10">Oktober</option>
                                            <option value="11">November</option>
                                            <option value="12">Desember</option>
                                        </select>
                                    </div>

                                    {/* Filter Tanggal Spesifik & Reset */}
                                    <div className="flex items-end gap-2">
                                        <div className="grid flex-grow gap-1.5">
                                            <Label htmlFor="tanggal_filter">Tanggal Spesifik</Label>
                                            <Input
                                                id="tanggal_filter"
                                                type="date"
                                                value={filterTanggal}
                                                onChange={(e) => {
                                                    setFilterTanggal(e.target.value);
                                                    if (e.target.value) {
                                                        setFilterTahun('all');
                                                        setFilterBulan('all');
                                                    }
                                                }}
                                                className="h-9"
                                            />
                                        </div>
                                        {isFilterActive && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-9 flex-shrink-0 px-3"
                                                onClick={handleResetFilters}
                                                title="Reset Filter"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-card w-full overflow-hidden rounded-xl border shadow-xs">
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                                            <thead>
                                                <tr className="bg-muted/40 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                                                    <th className="w-[120px] px-6 py-3">Tanggal</th>
                                                    <th className="w-[160px] px-6 py-3">No. Referensi</th>
                                                    <th className="px-6 py-3">Keterangan</th>
                                                    <th className="w-[110px] px-6 py-3 text-center">No Arus Kas</th>
                                                    <th className="w-[120px] px-6 py-3">Kode Akun</th>
                                                    <th className="px-6 py-3">Nama Akun</th>
                                                    <th className="w-[140px] px-6 py-3 text-right">Debit</th>
                                                    <th className="w-[140px] px-6 py-3 text-right">Kredit</th>
                                                    <th className="w-[80px] px-6 py-3 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {filteredJournals.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="text-muted-foreground px-6 py-16 text-center">
                                                            <Search className="text-muted-foreground/35 mx-auto mb-3 h-10 w-10" />
                                                            <h4 className="text-foreground text-base font-semibold">Tidak Ada Hasil Cocok</h4>
                                                            <p className="text-muted-foreground mt-1 text-sm">
                                                                Coba sesuaikan kata kunci pencarian atau bersihkan filter Anda.
                                                            </p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredJournals.flatMap((journal) =>
                                                        journal.items?.map((item, index) => (
                                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                                {index === 0 ? (
                                                                    <>
                                                                        <td
                                                                            className="text-muted-foreground animate-none px-6 py-4 align-top font-medium"
                                                                            rowSpan={journal.items.length}
                                                                        >
                                                                            {new Date(journal.tanggal).toLocaleDateString('id-ID', {
                                                                                year: 'numeric',
                                                                                month: '2-digit',
                                                                                day: '2-digit',
                                                                            })}
                                                                        </td>
                                                                        <td className="px-6 py-4 align-top" rowSpan={journal.items.length}>
                                                                            <span className="text-foreground mb-1 block font-mono font-bold">
                                                                                {journal.nomor_jurnal}
                                                                            </span>
                                                                            <span
                                                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                                                                    journal.tipe_jurnal === 'penyusutan'
                                                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                                                        : journal.tipe_jurnal === 'perolehan_aset'
                                                                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                                                          : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                                                                                }`}
                                                                            >
                                                                                {TIPE_JURNAL_LABELS[journal.tipe_jurnal]}
                                                                            </span>
                                                                        </td>
                                                                        <td
                                                                            className="text-muted-foreground max-w-[200px] px-6 py-4 align-top text-xs break-words"
                                                                            rowSpan={journal.items.length}
                                                                        >
                                                                            {journal.keterangan}
                                                                        </td>
                                                                    </>
                                                                ) : null}
                                                                <td className="text-foreground px-6 py-3 text-center font-mono text-xs">
                                                                    {journal.kode_arus_kas || '-'}
                                                                </td>
                                                                <td className="text-muted-foreground px-6 py-3 font-mono text-xs">
                                                                    {item.coa?.kode_akun}
                                                                </td>
                                                                <td
                                                                    className={`px-6 py-3 font-medium ${Number(item.kredit) > 0 ? 'text-muted-foreground pl-6' : 'text-foreground'}`}
                                                                >
                                                                    {item.coa?.nama_akun}
                                                                </td>
                                                                <td className="text-foreground px-6 py-3 text-right font-mono font-medium">
                                                                    {Number(item.debit) > 0 ? formatIDR(item.debit) : '-'}
                                                                </td>
                                                                <td className="text-foreground px-6 py-3 text-right font-mono font-medium">
                                                                    {Number(item.kredit) > 0 ? formatIDR(item.kredit) : '-'}
                                                                </td>
                                                                {index === 0 ? (
                                                                    <td className="px-6 py-4 text-center align-top" rowSpan={journal.items.length}>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                                                            onClick={() => handleDeleteJournal(journal.id)}
                                                                            title="Hapus Jurnal"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </td>
                                                                ) : null}
                                                            </tr>
                                                        )),
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: BUKU BESAR (LEDGER) */}
                {activeTab === 'ledger' &&
                    (() => {
                        const filteredLedger = ledgerData.filter((account) => {
                            const query = ledgerSearch.toLowerCase();
                            return account.coa.nama_akun.toLowerCase().includes(query) || account.coa.kode_akun.includes(query);
                        });

                        return (
                            <div className="space-y-6">
                                {/* Date Filters & Controls */}
                                <div className="bg-card flex flex-wrap items-end justify-between gap-4 rounded-xl border p-4">
                                    <form onSubmit={handleLedgerFilterSubmit} className="flex flex-1 flex-wrap items-end gap-4">
                                        <div className="grid w-40 gap-1.5">
                                            <Label htmlFor="ledger_start_date">Tanggal Mulai</Label>
                                            <input
                                                type="date"
                                                id="ledger_start_date"
                                                value={ledgerStartDate}
                                                onChange={(e) => setLedgerStartDate(e.target.value)}
                                                className="border-input bg-background text-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                                            />
                                        </div>
                                        <div className="grid w-40 gap-1.5">
                                            <Label htmlFor="ledger_end_date">Tanggal Selesai</Label>
                                            <input
                                                type="date"
                                                id="ledger_end_date"
                                                value={ledgerEndDate}
                                                onChange={(e) => setLedgerEndDate(e.target.value)}
                                                className="border-input bg-background text-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm" className="h-9">
                                                Terapkan Filter
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={handleLedgerFilterReset} className="h-9">
                                                Reset
                                            </Button>
                                        </div>
                                    </form>
                                    <div className="relative w-72">
                                        <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                                        <Input
                                            placeholder="Cari Akun Buku Besar..."
                                            value={ledgerSearch}
                                            onChange={(e) => setLedgerSearch(e.target.value)}
                                            className="h-9 pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Traditional Indonesian 6-Column General Ledger Cards */}
                                <div className="space-y-8">
                                    {filteredLedger.length === 0 ? (
                                        <div className="bg-card flex flex-col items-center justify-center rounded-xl border py-16 text-center">
                                            <Landmark className="text-muted-foreground/50 mb-3 h-10 w-10" />
                                            <h3 className="text-base font-semibold">Tidak ada akun Buku Besar</h3>
                                            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                                                Tidak ada data yang cocok dengan pencarian Anda atau periode terpilih.
                                            </p>
                                        </div>
                                    ) : (
                                        filteredLedger.map((account) => {
                                            return (
                                                <div key={account.coa.id} className="bg-card overflow-hidden rounded-xl border shadow-xs">
                                                    {/* Header */}
                                                    <div className="bg-muted/30 border-border/80 flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-primary text-lg font-semibold">{account.coa.nama_akun}</span>
                                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                Buku Besar
                                                            </span>
                                                        </div>
                                                        <span className="text-muted-foreground bg-background rounded-md border px-3 py-1 font-mono text-sm font-bold">
                                                            Kode Akun: {account.coa.kode_akun}
                                                        </span>
                                                    </div>

                                                    {/* Table */}
                                                    <div className="w-full overflow-x-auto">
                                                        <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                                                            <thead>
                                                                <tr className="bg-muted/10 text-muted-foreground border-t border-b text-center text-xs font-bold tracking-wider uppercase">
                                                                    <th className="border-border/40 border-r px-6 py-3 text-left" rowSpan={2}>
                                                                        Tanggal
                                                                    </th>
                                                                    <th className="border-border/40 border-r px-6 py-3 text-left" rowSpan={2}>
                                                                        Keterangan
                                                                    </th>
                                                                    <th className="border-border/40 w-36 border-r px-6 py-3 text-right" rowSpan={2}>
                                                                        Debit
                                                                    </th>
                                                                    <th className="border-border/40 w-36 border-r px-6 py-3 text-right" rowSpan={2}>
                                                                        Kredit
                                                                    </th>
                                                                    <th className="w-80 px-6 py-1.5 text-center" colSpan={2}>
                                                                        Saldo
                                                                    </th>
                                                                </tr>
                                                                <tr className="bg-muted/10 text-muted-foreground border-b text-right text-xs font-bold tracking-wider uppercase">
                                                                    <th className="border-border/40 w-40 border-r px-6 py-2">Debit</th>
                                                                    <th className="w-40 px-6 py-2">Kredit</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y font-mono">
                                                                {/* Saldo Awal (Opening Balance) Row */}
                                                                <tr className="bg-muted/5 hover:bg-muted/10 italic transition-colors">
                                                                    <td className="text-muted-foreground border-border/40 border-r px-6 py-3 font-sans">
                                                                        -
                                                                    </td>
                                                                    <td className="text-muted-foreground border-border/40 border-r px-6 py-3 font-sans">
                                                                        Saldo Awal (Opening Balance)
                                                                    </td>
                                                                    <td className="text-muted-foreground border-border/40 border-r px-6 py-3 text-right">
                                                                        -
                                                                    </td>
                                                                    <td className="text-muted-foreground border-border/40 border-r px-6 py-3 text-right">
                                                                        -
                                                                    </td>
                                                                    <td className="text-muted-foreground border-border/40 border-r px-6 py-3 text-right">
                                                                        {account.coa.saldo_normal === 'debit' ? formatIDR(account.saldo_awal) : '-'}
                                                                    </td>
                                                                    <td className="text-muted-foreground px-6 py-3 text-right">
                                                                        {account.coa.saldo_normal === 'kredit' ? formatIDR(account.saldo_awal) : '-'}
                                                                    </td>
                                                                </tr>

                                                                {/* Journal Items */}
                                                                {account.items.map((item) => {
                                                                    const isDeb = Number(item.debit) > 0;
                                                                    const isKred = Number(item.kredit) > 0;
                                                                    const runningVal = Number(item.saldo_berjalan) || 0;

                                                                    // Determine if running balance goes in Debit or Kredit column based on normal balance
                                                                    const showInDebColumn =
                                                                        account.coa.saldo_normal === 'debit' ? runningVal >= 0 : runningVal < 0;
                                                                    const showInKredColumn =
                                                                        account.coa.saldo_normal === 'kredit' ? runningVal >= 0 : runningVal < 0;

                                                                    const finalVal = Math.abs(runningVal);

                                                                    return (
                                                                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                                                            <td className="text-muted-foreground border-border/40 border-r px-6 py-3 font-sans">
                                                                                {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                                                            </td>
                                                                            <td className="text-foreground border-border/40 border-r px-6 py-3 font-sans font-medium">
                                                                                {item.nomor_jurnal} &bull;{' '}
                                                                                <span className="text-muted-foreground text-xs font-normal">
                                                                                    {item.keterangan}
                                                                                </span>
                                                                            </td>
                                                                            <td className="text-foreground border-border/40 border-r px-6 py-3 text-right">
                                                                                {isDeb ? formatIDR(item.debit) : '-'}
                                                                            </td>
                                                                            <td className="text-foreground border-border/40 border-r px-6 py-3 text-right">
                                                                                {isKred ? formatIDR(item.kredit) : '-'}
                                                                            </td>
                                                                            <td className="text-foreground border-border/40 border-r px-6 py-3 text-right">
                                                                                {showInDebColumn && finalVal !== 0 ? formatIDR(finalVal) : '-'}
                                                                            </td>
                                                                            <td className="text-foreground px-6 py-3 text-right">
                                                                                {showInKredColumn && finalVal !== 0 ? formatIDR(finalVal) : '-'}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                            {/* Subtotal Row */}
                                                            <tfoot>
                                                                <tr className="bg-muted/30 text-foreground border-t font-sans font-bold">
                                                                    <td className="border-border/40 border-r px-6 py-3" colSpan={2}>
                                                                        Total
                                                                    </td>
                                                                    <td className="border-border/40 border-r px-6 py-3 text-right font-mono">
                                                                        {formatIDR(account.total_debit)}
                                                                    </td>
                                                                    <td className="border-border/40 border-r px-6 py-3 text-right font-mono">
                                                                        {formatIDR(account.total_kredit)}
                                                                    </td>
                                                                    <td className="border-border/40 border-r px-6 py-3 text-right font-mono">
                                                                        {account.coa.saldo_normal === 'debit' ? formatIDR(account.saldo_akhir) : '-'}
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right font-mono">
                                                                        {account.coa.saldo_normal === 'kredit' ? formatIDR(account.saldo_akhir) : '-'}
                                                                    </td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Grand Total Buku Besar */}
                                {filteredLedger.length > 0 && (
                                    <div className="bg-primary/5 border-primary/20 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
                                        <span className="text-foreground text-sm font-bold uppercase">Total Keseluruhan Buku Besar Umum</span>
                                        <div className="flex gap-6 font-mono text-sm font-bold">
                                            <div className="text-right">
                                                <span className="text-muted-foreground block font-sans text-[10px]">Total Debit</span>
                                                <span className="text-foreground text-base">{formatIDR(grandTotalDebit)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-muted-foreground block font-sans text-[10px]">Total Kredit</span>
                                                <span className="text-foreground text-base">{formatIDR(grandTotalKredit)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

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
                            {/* Row 1: Tanggal, Jenis Transaksi, Kategori, Kode Arus Kas */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="tanggal">Tanggal Transaksi</Label>
                                    <Input
                                        id="tanggal"
                                        type="date"
                                        value={data.tanggal}
                                        onChange={(e) => setData('tanggal', e.target.value)}
                                        required
                                    />
                                    {errors.tanggal && <span className="text-xs text-red-500">{errors.tanggal}</span>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="jenis_transaksi">Jenis Transaksi</Label>
                                    <select
                                        id="jenis_transaksi"
                                        value={data.jenis_transaksi}
                                        onChange={(e) => setData('jenis_transaksi', e.target.value)}
                                        className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                                        required
                                    >
                                        <option value="jurnal_umum">Jurnal Umum</option>
                                        <option value="kas_masuk">Kas Masuk</option>
                                        <option value="kas_keluar">Kas Keluar</option>
                                        <option value="bank_masuk">Bank Masuk</option>
                                        <option value="bank_keluar">Bank Keluar</option>
                                        <option value="jurnal_koreksi">Jurnal Koreksi</option>
                                    </select>
                                    {errors.jenis_transaksi && <span className="text-xs text-red-500">{errors.jenis_transaksi}</span>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="kategori_arus_kas">Kategori Arus Kas</Label>
                                    <select
                                        id="kategori_arus_kas"
                                        value={data.kategori_arus_kas}
                                        onChange={(e) => setData('kategori_arus_kas', e.target.value)}
                                        className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                                        required
                                    >
                                        <option value="operasional">Operasional (O)</option>
                                        <option value="investasi">Investasi (I)</option>
                                        <option value="pendanaan">Pendanaan (P)</option>
                                    </select>
                                    {errors.kategori_arus_kas && <span className="text-xs text-red-500">{errors.kategori_arus_kas}</span>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="kode_arus_kas">Kode Arus Kas</Label>
                                    <Input id="kode_arus_kas" value={data.kode_arus_kas} readOnly className="bg-muted h-9 font-mono font-semibold" />
                                    {errors.kode_arus_kas && <span className="text-xs text-red-500">{errors.kode_arus_kas}</span>}
                                </div>
                            </div>

                            {/* Row 2: Uraian Transaksi */}
                            <div className="grid gap-2">
                                <Label htmlFor="keterangan">Uraian Transaksi</Label>
                                <Input
                                    id="keterangan"
                                    placeholder="Contoh: Pembelian perlengkapan kantor secara tunai"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    required
                                />
                                {errors.keterangan && <span className="text-xs text-red-500">{errors.keterangan}</span>}
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

                                <div className="space-y-3">
                                    {data.items.map((item, index) => (
                                        <div key={index} className="flex flex-col gap-1 border-b border-muted/50 pb-2.5 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2">
                                                {/* COA SELECT */}
                                                <div className="flex-1">
                                                    <select
                                                        value={item.coa_id}
                                                        onChange={(e) => handleItemChange(index, 'coa_id', e.target.value)}
                                                        className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:outline-hidden"
                                                        required
                                                    >
                                                        <option value="">-- Pilih Akun --</option>
                                                        {Object.entries(groupCoasByParent(transactionCoas)).map(([parentLabel, items]) => (
                                                            <optgroup key={parentLabel} label={parentLabel}>
                                                                {items.map((coa) => (
                                                                    <option key={coa.id} value={coa.id}>
                                                                        {coa.nama_akun}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
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

                                            {/* ROW FIELD ERRORS */}
                                            {(errors[`items.${index}.coa_id`] || errors[`items.${index}.debit`] || errors[`items.${index}.kredit`]) && (
                                                <div className="flex gap-2 px-1 text-[11px] font-medium text-red-500">
                                                    <div className="flex-1 truncate">
                                                        {errors[`items.${index}.coa_id`]}
                                                    </div>
                                                    <div className="w-1/4 truncate">
                                                        {errors[`items.${index}.debit`]}
                                                    </div>
                                                    <div className="w-1/4 truncate">
                                                        {errors[`items.${index}.kredit`]}
                                                    </div>
                                                    <div className="w-9"></div>
                                                </div>
                                            )}
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

                            {!isBalanced && (
                                <p className="text-[11px] text-amber-600 mt-1.5 px-1 font-medium leading-normal">
                                    * Tombol Simpan Jurnal dinonaktifkan karena total Debit dan total Kredit belum seimbang atau masih bernilai Rp 0.
                                </p>
                            )}
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
