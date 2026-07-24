import { Field, FilterBar, PageHeader, PageShell, SectionHeading } from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableContainer, TableEmpty, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type Asset, type BreadcrumbItem, type Coa, type Journal } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Calculator, FileText, Landmark, Plus, Search, ShieldCheck, Trash2, Undo, X } from 'lucide-react';
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
    lockDate?: string;
}

const TIPE_JURNAL_LABELS: Record<string, string> = {
    umum: 'Jurnal Umum',
    perolehan_aset: 'Perolehan Aset',
    penyusutan: 'Penyusutan Aset',
};

const TIPE_JURNAL_TONES: Record<string, 'warning' | 'info' | 'secondary'> = {
    penyusutan: 'warning',
    perolehan_aset: 'info',
    umum: 'secondary',
};

const BULAN_OPTIONS = [
    ['01', 'Januari'],
    ['02', 'Februari'],
    ['03', 'Maret'],
    ['04', 'April'],
    ['05', 'Mei'],
    ['06', 'Juni'],
    ['07', 'Juli'],
    ['08', 'Agustus'],
    ['09', 'September'],
    ['10', 'Oktober'],
    ['11', 'November'],
    ['12', 'Desember'],
];

/** Vertical rule separating the ledger's column groups. */
const LEDGER_DIVIDER = 'border-border/60 border-r';

export default function Index({
    journals,
    coas,
    ledgerData = [],
    grandTotalDebit = 0,
    grandTotalKredit = 0,
    ledgerFilters,
    postedMonths,
    assets,
    lockDate,
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
    const [ledgerStartDate, setLedgerStartDate] = useState(ledgerFilters?.start_date || `${new Date().getFullYear()}-01-01`);
    const [ledgerEndDate, setLedgerEndDate] = useState(ledgerFilters?.end_date || new Date().toISOString().split('T')[0]);
    const [ledgerSearch, setLedgerSearch] = useState('');
    const [selectedLedgerCoa, setSelectedLedgerCoa] = useState('all');
    const [ledgerError, setLedgerError] = useState<string | null>(null);

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
    const [depYear, setDepYear] = useState<string>(() => today.getFullYear().toString());
    const [depMonth, setDepMonth] = useState<string>(() => String(today.getMonth() + 1).padStart(2, '0'));
    const selectedMonth = `${depYear}-${depMonth}`;

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
        bulan: selectedMonth,
    });

    const handleLedgerFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const startYear = new Date(ledgerStartDate).getFullYear();
        const endYear = new Date(ledgerEndDate).getFullYear();

        if (startYear !== endYear) {
            setLedgerError('Rentang tanggal tidak boleh melewati dua tahun yang berbeda.');
            return;
        }

        setLedgerError(null);
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
        setLedgerError(null);
        const currentYear = new Date().getFullYear();
        const start = `${currentYear}-01-01`;
        const end = new Date().toLocaleDateString('en-CA');
        setLedgerStartDate(start);
        setLedgerEndDate(end);
        setSelectedLedgerCoa('all');
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

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleDeleteJournal = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus jurnal ini? Tindakan ini akan menghapus detail debit dan kredit secara permanen.')) {
            router.delete(route('journals.destroy', id));
        }
    };

    const handleReverseJournal = (id: number) => {
        if (
            confirm(
                'Apakah Anda yakin ingin membalikkan jurnal ini? Tindakan ini akan membuat jurnal pembalik baru untuk menihilkan efek transaksi asli.',
            )
        ) {
            router.post(route('journals.reverse', id));
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

    const pageTitle = activeTab === 'ledger' ? 'Buku Besar Umum' : activeTab === 'depresiasi' ? 'Penyusutan Bulanan' : 'Jurnal Umum';

    return (
        <AppLayout breadcrumbs={dynamicBreadcrumbs}>
            <Head title={pageTitle} />

            <PageShell>
                <PageHeader
                    title={pageTitle}
                    description={
                        activeTab === 'ledger' ? (
                            <>
                                Lihat ringkasan mutasi debit dan kredit serta saldo berjalan untuk setiap akun.
                                <span className="text-foreground mt-1 block font-medium">
                                    Periode: {formatDate(ledgerStartDate)} – {formatDate(ledgerEndDate)}
                                </span>
                            </>
                        ) : activeTab === 'depresiasi' ? (
                            'Kelola dan lakukan posting penyusutan nilai buku aset secara berkala.'
                        ) : (
                            'Pencatatan akuntansi double-entry manual maupun otomatis.'
                        )
                    }
                    actions={
                        activeTab === 'umum' ? (
                            <Button onClick={() => setIsOpen(true)}>
                                <Plus />
                                Jurnal Manual
                            </Button>
                        ) : undefined
                    }
                />

                {/* TAB CONTENT: JURNAL UMUM */}
                {activeTab === 'umum' &&
                    (journals.length === 0 ? (
                        <div className="bg-card flex flex-col items-center justify-center gap-1 rounded-xl border py-16 text-center shadow-xs">
                            <FileText className="text-muted-foreground/40 mb-2 size-10" aria-hidden="true" />
                            <h2 className="text-base font-semibold">Belum Ada Transaksi Jurnal</h2>
                            <p className="text-muted-foreground max-w-sm text-sm">
                                Mulai catat transaksi manual Anda atau buat aset tetap untuk memicu jurnal otomatis.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Filter Controls */}
                            <FilterBar className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                                <Field>
                                    <Label htmlFor="search">Cari Jurnal</Label>
                                    <div className="relative">
                                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                        <Input
                                            id="search"
                                            inputSize="sm"
                                            placeholder="No. referensi, uraian, aset..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </Field>

                                <Field>
                                    <Label htmlFor="jenis_filter">Jenis Aset</Label>
                                    <NativeSelect
                                        id="jenis_filter"
                                        selectSize="sm"
                                        value={filterJenis}
                                        onChange={(e) => setFilterJenis(e.target.value)}
                                    >
                                        <option value="all">Semua Jenis</option>
                                        <option value="inventaris">Inventaris</option>
                                        <option value="kendaraan">Kendaraan</option>
                                        <option value="gedung">Gedung</option>
                                    </NativeSelect>
                                </Field>

                                <Field>
                                    <Label htmlFor="tahun_filter">Tahun Transaksi</Label>
                                    <NativeSelect
                                        id="tahun_filter"
                                        selectSize="sm"
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
                                    </NativeSelect>
                                </Field>

                                <Field>
                                    <Label htmlFor="bulan_filter">Bulan Transaksi</Label>
                                    <NativeSelect
                                        id="bulan_filter"
                                        selectSize="sm"
                                        value={filterBulan}
                                        onChange={(e) => {
                                            setFilterBulan(e.target.value);
                                            setFilterTanggal('');
                                        }}
                                    >
                                        <option value="all">Semua Bulan</option>
                                        {BULAN_OPTIONS.map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>

                                <div className="flex items-end gap-2">
                                    <Field className="min-w-0 flex-1">
                                        <Label htmlFor="tanggal_filter">Tanggal Spesifik</Label>
                                        <DatePicker
                                            id="tanggal_filter"
                                            size="sm"
                                            value={filterTanggal}
                                            onChange={(val) => {
                                                setFilterTanggal(val);
                                                if (val) {
                                                    setFilterTahun('all');
                                                    setFilterBulan('all');
                                                }
                                            }}
                                        />
                                    </Field>
                                    {isFilterActive && (
                                        <Button type="button" variant="outline" size="icon-sm" onClick={handleResetFilters} title="Reset filter">
                                            <X />
                                            <span className="sr-only">Reset filter</span>
                                        </Button>
                                    )}
                                </div>
                            </FilterBar>

                            {/* Journal Table */}
                            <TableContainer>
                                <Table minWidth="min-w-[1100px]">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead align="center" className="w-32">
                                                Tanggal
                                            </TableHead>
                                            <TableHead className="w-44">No. Referensi</TableHead>
                                            <TableHead className="min-w-[200px]">Rincian Transaksi</TableHead>
                                            <TableHead align="center" className="w-28">
                                                No Arus Kas
                                            </TableHead>
                                            <TableHead className="w-36">Kode Akun</TableHead>
                                            <TableHead className="min-w-[180px]">Nama Akun</TableHead>
                                            <TableHead align="right" className="w-40">
                                                Debit
                                            </TableHead>
                                            <TableHead align="right" className="w-40">
                                                Kredit
                                            </TableHead>
                                            <TableHead align="center" className="w-20">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredJournals.length === 0 ? (
                                            <TableEmpty
                                                colSpan={9}
                                                icon={<Search className="text-muted-foreground/40 mb-1 size-10" />}
                                                title="Tidak Ada Hasil Cocok"
                                                description="Coba sesuaikan kata kunci pencarian atau bersihkan filter Anda."
                                            />
                                        ) : (
                                            filteredJournals.flatMap((journal) => {
                                                const items = journal.items ?? [];
                                                const isLocked = !!lockDate && new Date(journal.tanggal) <= new Date(lockDate);
                                                const isReversed = !!journal.reversed_by_id;
                                                const isReversal = !!journal.reverses_journal_id;

                                                return items.map((item, index) => (
                                                    <TableRow key={item.id}>
                                                        {index === 0 ? (
                                                            <>
                                                                <TableCell
                                                                    align="center"
                                                                    className="text-muted-foreground align-top font-mono font-medium tabular-nums"
                                                                    rowSpan={items.length}
                                                                >
                                                                    {formatDate(journal.tanggal)}
                                                                </TableCell>
                                                                <TableCell className="align-top" rowSpan={items.length}>
                                                                    <span className="text-foreground block font-mono text-xs font-bold">
                                                                        {journal.nomor_jurnal}
                                                                    </span>
                                                                    <span className="mt-1.5 flex flex-col items-start gap-1">
                                                                        <Badge variant={TIPE_JURNAL_TONES[journal.tipe_jurnal] ?? 'secondary'}>
                                                                            {TIPE_JURNAL_LABELS[journal.tipe_jurnal]}
                                                                        </Badge>
                                                                        {isReversed && (
                                                                            <Badge
                                                                                variant="danger"
                                                                                title={`Jurnal pembalik: ${journal.reversed_by?.nomor_jurnal}`}
                                                                            >
                                                                                Sudah Dibalik
                                                                            </Badge>
                                                                        )}
                                                                        {isReversal && (
                                                                            <Badge
                                                                                variant="accent"
                                                                                title={`Membalik jurnal: ${journal.reverses_journal?.nomor_jurnal}`}
                                                                            >
                                                                                Jurnal Pembalik
                                                                            </Badge>
                                                                        )}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell
                                                                    className="text-muted-foreground align-top break-words"
                                                                    rowSpan={items.length}
                                                                >
                                                                    {journal.keterangan}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="center"
                                                                    className="text-muted-foreground align-top font-mono text-xs"
                                                                    rowSpan={items.length}
                                                                >
                                                                    {journal.kode_arus_kas || '-'}
                                                                </TableCell>
                                                            </>
                                                        ) : null}
                                                        <TableCell className="text-muted-foreground font-mono text-xs">
                                                            {item.coa?.kode_akun}
                                                        </TableCell>
                                                        <TableCell
                                                            className={
                                                                Number(item.kredit) > 0 ? 'text-muted-foreground pl-8' : 'text-foreground font-medium'
                                                            }
                                                        >
                                                            {item.coa?.nama_akun}
                                                        </TableCell>
                                                        <TableCell numeric className="text-foreground font-medium">
                                                            {Number(item.debit) > 0 ? formatIDR(item.debit) : '-'}
                                                        </TableCell>
                                                        <TableCell numeric className="text-foreground font-medium">
                                                            {Number(item.kredit) > 0 ? formatIDR(item.kredit) : '-'}
                                                        </TableCell>
                                                        {index === 0 ? (
                                                            <TableCell align="center" className="align-top" rowSpan={items.length}>
                                                                {isReversed || isReversal ? (
                                                                    <span className="text-muted-foreground text-xs font-medium">Terkunci</span>
                                                                ) : isLocked ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon-xs"
                                                                        className="text-muted-foreground hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400"
                                                                        onClick={() => handleReverseJournal(journal.id)}
                                                                        title="Balikkan jurnal (reverse)"
                                                                    >
                                                                        <Undo />
                                                                        <span className="sr-only">Balikkan jurnal</span>
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon-xs"
                                                                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={() => handleDeleteJournal(journal.id)}
                                                                        title="Hapus jurnal"
                                                                    >
                                                                        <Trash2 />
                                                                        <span className="sr-only">Hapus jurnal</span>
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        ) : null}
                                                    </TableRow>
                                                ));
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    ))}

                {/* TAB CONTENT: BUKU BESAR (LEDGER) */}
                {activeTab === 'ledger' &&
                    (() => {
                        const filteredLedger = ledgerData.filter((account) => {
                            const query = ledgerSearch.toLowerCase();
                            const matchSearch = account.coa.nama_akun.toLowerCase().includes(query) || account.coa.kode_akun.includes(query);
                            const matchCoa = selectedLedgerCoa === 'all' || account.coa.id.toString() === selectedLedgerCoa;
                            return matchSearch && matchCoa;
                        });

                        return (
                            <>
                                {/* Error Banner */}
                                {(ledgerError || (errors && errors.start_date)) && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="size-4" />
                                        <AlertTitle>Kesalahan</AlertTitle>
                                        <AlertDescription>{ledgerError || (errors.start_date as string)}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Date & Account Filters */}
                                <form onSubmit={handleLedgerFilterSubmit}>
                                    <FilterBar className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                                        <Field>
                                            <Label htmlFor="ledger_start_date">Tanggal Mulai</Label>
                                            <DatePicker id="ledger_start_date" size="sm" value={ledgerStartDate} onChange={setLedgerStartDate} />
                                        </Field>

                                        <Field>
                                            <Label htmlFor="ledger_end_date">Tanggal Selesai</Label>
                                            <DatePicker id="ledger_end_date" size="sm" value={ledgerEndDate} onChange={setLedgerEndDate} />
                                        </Field>

                                        <Field>
                                            <Label htmlFor="ledger_coa_filter">Pilih Akun Buku Besar</Label>
                                            <NativeSelect
                                                id="ledger_coa_filter"
                                                selectSize="sm"
                                                value={selectedLedgerCoa}
                                                onChange={(e) => setSelectedLedgerCoa(e.target.value)}
                                            >
                                                <option value="all">Semua Akun</option>
                                                {ledgerData.map((acc) => (
                                                    <option key={acc.coa.id} value={acc.coa.id}>
                                                        [{acc.coa.kode_akun}] {acc.coa.nama_akun}
                                                    </option>
                                                ))}
                                            </NativeSelect>
                                        </Field>

                                        <Field>
                                            <Label htmlFor="ledger_search">Cari Nama / Kode</Label>
                                            <div className="relative">
                                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                                <Input
                                                    id="ledger_search"
                                                    inputSize="sm"
                                                    placeholder="Ketik nama/kode..."
                                                    value={ledgerSearch}
                                                    onChange={(e) => setLedgerSearch(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </Field>

                                        <div className="flex items-end gap-2">
                                            <Button type="submit" size="sm" className="flex-1">
                                                Terapkan
                                            </Button>
                                            <Button type="button" size="sm" variant="outline" onClick={handleLedgerFilterReset}>
                                                Reset
                                            </Button>
                                        </div>
                                    </FilterBar>
                                </form>

                                {/* Traditional Indonesian 6-Column General Ledger Cards */}
                                {filteredLedger.length === 0 ? (
                                    <div className="bg-card flex flex-col items-center justify-center gap-1 rounded-xl border py-16 text-center shadow-xs">
                                        <Landmark className="text-muted-foreground/40 mb-2 size-10" aria-hidden="true" />
                                        <h2 className="text-base font-semibold">Tidak Ada Akun Buku Besar</h2>
                                        <p className="text-muted-foreground max-w-sm text-sm">
                                            Tidak ada data yang cocok dengan pencarian Anda atau periode terpilih.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {filteredLedger.map((account) => (
                                            <TableContainer key={account.coa.id}>
                                                <div className="bg-muted/30 border-b px-4 py-3 sm:px-5 sm:py-4">
                                                    <h2 className="text-foreground font-mono text-sm font-bold sm:text-base">
                                                        {account.coa.kode_akun} — {account.coa.nama_akun}
                                                    </h2>
                                                </div>

                                                <Table minWidth="min-w-[950px]">
                                                    <TableHeader>
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableHead className={`w-32 ${LEDGER_DIVIDER}`} rowSpan={2}>
                                                                Tanggal
                                                            </TableHead>
                                                            <TableHead className={`w-44 ${LEDGER_DIVIDER}`} rowSpan={2}>
                                                                No. Referensi
                                                            </TableHead>
                                                            <TableHead className={`min-w-[200px] ${LEDGER_DIVIDER}`} rowSpan={2}>
                                                                Rincian Transaksi
                                                            </TableHead>
                                                            <TableHead align="right" className={`w-40 ${LEDGER_DIVIDER}`} rowSpan={2}>
                                                                Debit
                                                            </TableHead>
                                                            <TableHead align="right" className={`w-40 ${LEDGER_DIVIDER}`} rowSpan={2}>
                                                                Kredit
                                                            </TableHead>
                                                            <TableHead align="center" className="w-80 py-2" colSpan={2}>
                                                                Saldo
                                                            </TableHead>
                                                        </TableRow>
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableHead align="right" className={`w-40 py-2 ${LEDGER_DIVIDER}`}>
                                                                Debit
                                                            </TableHead>
                                                            <TableHead align="right" className="w-40 py-2">
                                                                Kredit
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {/* Saldo Awal (Opening Balance) Row */}
                                                        <TableRow className="bg-muted/20">
                                                            <TableCell align="center" className={`text-muted-foreground ${LEDGER_DIVIDER}`}>
                                                                -
                                                            </TableCell>
                                                            <TableCell className={`text-muted-foreground ${LEDGER_DIVIDER}`}>-</TableCell>
                                                            <TableCell className={`text-muted-foreground italic ${LEDGER_DIVIDER}`}>
                                                                Saldo Awal (Opening Balance)
                                                            </TableCell>
                                                            <TableCell numeric className={`text-muted-foreground ${LEDGER_DIVIDER}`}>
                                                                -
                                                            </TableCell>
                                                            <TableCell numeric className={`text-muted-foreground ${LEDGER_DIVIDER}`}>
                                                                -
                                                            </TableCell>
                                                            <TableCell numeric className={`text-muted-foreground ${LEDGER_DIVIDER}`}>
                                                                {account.coa.saldo_normal === 'debit' ? formatIDR(account.saldo_awal) : '-'}
                                                            </TableCell>
                                                            <TableCell numeric className="text-muted-foreground">
                                                                {account.coa.saldo_normal === 'kredit' ? formatIDR(account.saldo_awal) : '-'}
                                                            </TableCell>
                                                        </TableRow>

                                                        {/* Journal Items */}
                                                        {account.items.map((item) => {
                                                            const isDeb = Number(item.debit) > 0;
                                                            const isKred = Number(item.kredit) > 0;
                                                            const runningVal = Number(item.saldo_berjalan) || 0;

                                                            // Running balance sits in the column matching the account's normal balance
                                                            const showInDebColumn =
                                                                account.coa.saldo_normal === 'debit' ? runningVal >= 0 : runningVal < 0;
                                                            const showInKredColumn =
                                                                account.coa.saldo_normal === 'kredit' ? runningVal >= 0 : runningVal < 0;

                                                            const finalVal = Math.abs(runningVal);

                                                            return (
                                                                <TableRow key={item.id}>
                                                                    <TableCell
                                                                        align="center"
                                                                        className={`text-muted-foreground font-mono tabular-nums ${LEDGER_DIVIDER}`}
                                                                    >
                                                                        {formatDate(item.tanggal)}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className={`text-foreground font-mono text-xs font-bold ${LEDGER_DIVIDER}`}
                                                                    >
                                                                        {item.nomor_jurnal}
                                                                    </TableCell>
                                                                    <TableCell className={`text-muted-foreground ${LEDGER_DIVIDER}`}>
                                                                        {item.keterangan}
                                                                    </TableCell>
                                                                    <TableCell numeric className={`text-foreground ${LEDGER_DIVIDER}`}>
                                                                        {isDeb ? formatIDR(item.debit) : '-'}
                                                                    </TableCell>
                                                                    <TableCell numeric className={`text-foreground ${LEDGER_DIVIDER}`}>
                                                                        {isKred ? formatIDR(item.kredit) : '-'}
                                                                    </TableCell>
                                                                    <TableCell numeric className={`text-foreground ${LEDGER_DIVIDER}`}>
                                                                        {showInDebColumn && finalVal !== 0 ? formatIDR(finalVal) : '-'}
                                                                    </TableCell>
                                                                    <TableCell numeric className="text-foreground">
                                                                        {showInKredColumn && finalVal !== 0 ? formatIDR(finalVal) : '-'}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                    <TableFooter>
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableCell className={`uppercase ${LEDGER_DIVIDER}`} colSpan={3}>
                                                                Total
                                                            </TableCell>
                                                            <TableCell numeric className={LEDGER_DIVIDER}>
                                                                {formatIDR(account.total_debit)}
                                                            </TableCell>
                                                            <TableCell numeric className={LEDGER_DIVIDER}>
                                                                {formatIDR(account.total_kredit)}
                                                            </TableCell>
                                                            <TableCell numeric className={LEDGER_DIVIDER}>
                                                                {account.coa.saldo_normal === 'debit' ? formatIDR(account.saldo_akhir) : '-'}
                                                            </TableCell>
                                                            <TableCell numeric>
                                                                {account.coa.saldo_normal === 'kredit' ? formatIDR(account.saldo_akhir) : '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableFooter>
                                                </Table>
                                            </TableContainer>
                                        ))}
                                    </div>
                                )}

                                {/* Grand Total Buku Besar */}
                                {filteredLedger.length > 0 && (
                                    <div className="bg-primary/5 border-primary/20 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
                                        <h2 className="text-foreground text-sm font-bold uppercase">Total Keseluruhan Buku Besar Umum</h2>
                                        <div className="flex gap-6">
                                            <div className="text-right">
                                                <span className="text-muted-foreground block text-xs">Total Debit</span>
                                                <span className="text-foreground font-mono text-base font-bold tabular-nums">
                                                    {formatIDR(grandTotalDebit)}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-muted-foreground block text-xs">Total Kredit</span>
                                                <span className="text-foreground font-mono text-base font-bold tabular-nums">
                                                    {formatIDR(grandTotalKredit)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}

                {/* TAB CONTENT: PENYUSUTAN BULANAN */}
                {activeTab === 'depresiasi' && (
                    <>
                        {/* Selector Month */}
                        <FilterBar className="sm:grid-cols-2 lg:grid-cols-4">
                            <Field>
                                <Label htmlFor="dep_month_select">Bulan</Label>
                                <NativeSelect id="dep_month_select" selectSize="sm" value={depMonth} onChange={(e) => setDepMonth(e.target.value)}>
                                    {BULAN_OPTIONS.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>

                            <Field>
                                <Label htmlFor="dep_year_select">Tahun</Label>
                                <NativeSelect id="dep_year_select" selectSize="sm" value={depYear} onChange={(e) => setDepYear(e.target.value)}>
                                    {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()).map((yr) => (
                                        <option key={yr} value={yr}>
                                            {yr}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>

                            <div className="flex h-9 items-center">
                                {isMonthAlreadyPosted ? (
                                    <Badge variant="success">
                                        <ShieldCheck aria-hidden="true" />
                                        Sudah diposting ke jurnal
                                    </Badge>
                                ) : (
                                    <Badge variant="warning">
                                        <AlertCircle aria-hidden="true" />
                                        Belum diposting ke jurnal
                                    </Badge>
                                )}
                            </div>

                            <Button size="sm" onClick={handlePostDepreciation} disabled={isMonthAlreadyPosted || previewAssets.length === 0}>
                                <Calculator />
                                Posting Jurnal
                            </Button>
                        </FilterBar>

                        {/* Estimasi Aset yg Disusutkan */}
                        <SectionHeading
                            title="Rincian Penyusutan Aset"
                            description="Aset aktif yang menyusut pada bulan terpilih."
                            actions={
                                <div className="text-right">
                                    <span className="text-muted-foreground block text-xs">Total estimasi penyusutan</span>
                                    <span className="text-foreground font-mono text-base font-bold tabular-nums">
                                        {formatIDR(totalMonthDepreciation)}
                                    </span>
                                </div>
                            }
                        />

                        <TableContainer>
                            <Table minWidth="min-w-[850px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="min-w-[220px]">Nama Aset</TableHead>
                                        <TableHead align="center" className="w-36">
                                            Jenis
                                        </TableHead>
                                        <TableHead align="center" className="w-44">
                                            Tanggal Perolehan
                                        </TableHead>
                                        <TableHead align="right" className="w-48">
                                            Harga Perolehan
                                        </TableHead>
                                        <TableHead align="right" className="w-52">
                                            Beban Penyusutan / Bulan
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewAssets.length === 0 ? (
                                        <TableEmpty colSpan={5} description="Tidak ada aset aktif yang menyusut pada bulan terpilih." />
                                    ) : (
                                        previewAssets.map((asset) => (
                                            <TableRow key={asset.id}>
                                                <TableCell className="text-foreground font-medium">{asset.nama}</TableCell>
                                                <TableCell align="center">
                                                    <Badge variant="secondary" className="capitalize">
                                                        {asset.jenis}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell align="center" className="text-muted-foreground font-mono tabular-nums">
                                                    {formatDate(asset.tanggal_perolehan)}
                                                </TableCell>
                                                <TableCell numeric className="text-foreground">
                                                    {formatIDR(asset.harga_perolehan)}
                                                </TableCell>
                                                <TableCell numeric className="text-foreground font-semibold">
                                                    {formatIDR(asset.penyusutan_bulanan)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </PageShell>

            {/* DIALOG FORM: CREATE MANUAL JOURNAL */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
                    <form onSubmit={handleSubmitJournal} className="grid gap-6">
                        <DialogHeader>
                            <DialogTitle>Buat Jurnal Manual Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan detail transaksi keuangan. Pastikan jumlah debit dan kredit seimbang (balance).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            {/* Row 1: Tanggal, Jenis Transaksi, Kategori, Kode Arus Kas */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Field>
                                    <Label htmlFor="tanggal">Tanggal Transaksi</Label>
                                    <DatePicker id="tanggal" value={data.tanggal} onChange={(val) => setData('tanggal', val)} />
                                    {errors.tanggal && <p className="text-destructive text-xs font-medium">{errors.tanggal}</p>}
                                </Field>
                                <Field>
                                    <Label htmlFor="jenis_transaksi">Jenis Transaksi</Label>
                                    <NativeSelect
                                        id="jenis_transaksi"
                                        value={data.jenis_transaksi}
                                        onChange={(e) => setData('jenis_transaksi', e.target.value)}
                                        required
                                    >
                                        <option value="jurnal_umum">Jurnal Umum</option>
                                        <option value="kas_masuk">Kas Masuk</option>
                                        <option value="kas_keluar">Kas Keluar</option>
                                        <option value="bank_masuk">Bank Masuk</option>
                                        <option value="bank_keluar">Bank Keluar</option>
                                        <option value="jurnal_koreksi">Jurnal Koreksi</option>
                                    </NativeSelect>
                                    {errors.jenis_transaksi && <p className="text-destructive text-xs font-medium">{errors.jenis_transaksi}</p>}
                                </Field>
                                <Field>
                                    <Label htmlFor="kategori_arus_kas">Kategori Arus Kas</Label>
                                    <NativeSelect
                                        id="kategori_arus_kas"
                                        value={data.kategori_arus_kas}
                                        onChange={(e) => setData('kategori_arus_kas', e.target.value)}
                                        required
                                    >
                                        <option value="operasional">Operasional (O)</option>
                                        <option value="investasi">Investasi (I)</option>
                                        <option value="pendanaan">Pendanaan (P)</option>
                                    </NativeSelect>
                                    {errors.kategori_arus_kas && <p className="text-destructive text-xs font-medium">{errors.kategori_arus_kas}</p>}
                                </Field>
                                <Field>
                                    <Label htmlFor="kode_arus_kas">Kode Arus Kas</Label>
                                    <Input id="kode_arus_kas" value={data.kode_arus_kas} readOnly className="bg-muted font-mono font-semibold" />
                                    {errors.kode_arus_kas && <p className="text-destructive text-xs font-medium">{errors.kode_arus_kas}</p>}
                                </Field>
                            </div>

                            {/* Row 2: Rincian Transaksi */}
                            <Field>
                                <Label htmlFor="keterangan">Rincian Transaksi</Label>
                                <Input
                                    id="keterangan"
                                    placeholder="Contoh: Pembelian perlengkapan kantor secara tunai"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    required
                                />
                                {errors.keterangan && <p className="text-destructive text-xs font-medium">{errors.keterangan}</p>}
                            </Field>

                            {/* Baris Debit/Kredit Dinamis */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold">Baris Posting Jurnal</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow}>
                                        <Plus />
                                        Tambah Baris
                                    </Button>
                                </div>

                                {errors.items && (
                                    <p className="bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-xs font-medium">
                                        {errors.items}
                                    </p>
                                )}

                                <div className="space-y-3">
                                    {data.items.map((item, index) => (
                                        <div key={index} className="border-border/60 space-y-1.5 border-b pb-3 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2">
                                                <NativeSelect
                                                    wrapperClassName="flex-1"
                                                    selectSize="sm"
                                                    value={item.coa_id}
                                                    onChange={(e) => handleItemChange(index, 'coa_id', e.target.value)}
                                                    aria-label={`Akun baris ${index + 1}`}
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
                                                </NativeSelect>

                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    inputSize="sm"
                                                    placeholder="Debit (Rp)"
                                                    aria-label={`Debit baris ${index + 1}`}
                                                    className="w-1/4 min-w-24 text-right font-mono tabular-nums"
                                                    value={item.debit || ''}
                                                    onChange={(e) => handleItemChange(index, 'debit', e.target.value)}
                                                    disabled={Number(item.kredit) > 0}
                                                />

                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    inputSize="sm"
                                                    placeholder="Kredit (Rp)"
                                                    aria-label={`Kredit baris ${index + 1}`}
                                                    className="w-1/4 min-w-24 text-right font-mono tabular-nums"
                                                    value={item.kredit || ''}
                                                    onChange={(e) => handleItemChange(index, 'kredit', e.target.value)}
                                                    disabled={Number(item.debit) > 0}
                                                />

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-muted-foreground hover:text-destructive shrink-0 disabled:opacity-30"
                                                    disabled={data.items.length <= 2}
                                                    onClick={() => handleRemoveItemRow(index)}
                                                    title="Hapus baris"
                                                >
                                                    <Trash2 />
                                                    <span className="sr-only">Hapus baris</span>
                                                </Button>
                                            </div>

                                            {(errors[`items.${index}.coa_id`] ||
                                                errors[`items.${index}.debit`] ||
                                                errors[`items.${index}.kredit`]) && (
                                                <div className="text-destructive flex gap-2 text-xs font-medium">
                                                    <span className="flex-1 truncate">{errors[`items.${index}.coa_id`]}</span>
                                                    <span className="w-1/4 truncate">{errors[`items.${index}.debit`]}</span>
                                                    <span className="w-1/4 truncate">{errors[`items.${index}.kredit`]}</span>
                                                    <span className="w-9" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary & Balance Check */}
                            <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                                <div className="flex gap-6">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Total Debit</span>
                                        <span className="text-foreground font-mono text-sm font-bold tabular-nums">{formatIDR(totalDebit)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Total Kredit</span>
                                        <span className="text-foreground font-mono text-sm font-bold tabular-nums">{formatIDR(totalKredit)}</span>
                                    </div>
                                </div>
                                <Badge variant={isBalanced ? 'success' : 'danger'}>{isBalanced ? 'Seimbang (Balanced)' : 'Tidak Seimbang'}</Badge>
                            </div>

                            {!isBalanced && (
                                <p className="text-xs leading-relaxed font-medium text-amber-600 dark:text-amber-400">
                                    Tombol Simpan Jurnal dinonaktifkan karena total debit dan total kredit belum seimbang atau masih bernilai Rp 0.
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
