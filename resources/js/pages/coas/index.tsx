import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Coa } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Chart of Accounts',
        href: '/coas',
    },
];

interface CoasProps {
    coas: Coa[];
}

const KATEGORI_LABELS: Record<string, string> = {
    aset: 'Aset / Harta',
    kewajiban: 'Kewajiban / Utang',
    ekuitas: 'Ekuitas / Modal',
    pendapatan: 'Pendapatan',
    beban: 'Beban',
};

const JENIS_LAPORAN_LABELS: Record<string, string> = {
    LPK: 'Laporan Posisi Keuangan (Neraca)',
    LR: 'Laba Rugi',
};

const SALDO_LABELS: Record<string, string> = {
    debit: 'Debit',
    kredit: 'Kredit',
};



export default function Index({ coas }: CoasProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCoa, setSelectedCoa] = useState<Coa | null>(null);
    const [level1Filter, setLevel1Filter] = useState('all');
    const [level2Filter, setLevel2Filter] = useState('all');
    const [level3Filter, setLevel3Filter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [saldoFilter, setSaldoFilter] = useState('all');
    const [laporanFilter, setLaporanFilter] = useState('all');

    // Split coas into Parent and Transaction (Child) accounts
    const parentCoas = coas.filter((c) => c.kode_akun.split('.').length < 4);
    const transactionCoas = coas.filter((c) => c.kode_akun.split('.').length === 4);

    // Hierarchy parents for cascading filter
    const level1Parents = parentCoas.filter((p) => p.kode_akun.split('.').length === 1);
    const level2Options = level1Filter !== 'all'
        ? parentCoas.filter((p) => p.kode_akun.split('.').length === 2 && p.kode_akun.startsWith(level1Filter + '.'))
        : parentCoas.filter((p) => p.kode_akun.split('.').length === 2);
    const level3Options = level2Filter !== 'all'
        ? parentCoas.filter((p) => p.kode_akun.split('.').length === 3 && p.kode_akun.startsWith(level2Filter + '.'))
        : level1Filter !== 'all'
            ? parentCoas.filter((p) => p.kode_akun.split('.').length === 3 && p.kode_akun.startsWith(level1Filter + '.'))
            : parentCoas.filter((p) => p.kode_akun.split('.').length === 3);

    const level3Parents = parentCoas.filter((p) => p.kode_akun.split('.').length === 3);

    // Modal cascading state
    const [modalLevel1, setModalLevel1] = useState('');
    const [modalLevel2, setModalLevel2] = useState('');
    const [modalLevel3, setModalLevel3] = useState('');

    const modalLevel2Options = modalLevel1
        ? parentCoas.filter((p) => p.kode_akun.split('.').length === 2 && p.kode_akun.startsWith(modalLevel1 + '.'))
        : [];
    const modalLevel3Options = modalLevel2
        ? parentCoas.filter((p) => p.kode_akun.split('.').length === 3 && p.kode_akun.startsWith(modalLevel2 + '.'))
        : [];

    const resetModalLevels = () => {
        setModalLevel1('');
        setModalLevel2('');
        setModalLevel3('');
    };

    const generateNextKodeAkun = (kelompokPrefix: string): string => {
        const prefixWithDot = kelompokPrefix + '.';
        const matchingCoas = transactionCoas.filter((c) => c.kode_akun.startsWith(prefixWithDot));

        if (matchingCoas.length === 0) {
            return `${prefixWithDot}01`;
        }

        const sequenceNumbers = matchingCoas.map((c) => {
            const parts = c.kode_akun.split('.');
            const lastPart = parts[parts.length - 1];
            const parsed = parseInt(lastPart, 10);
            return isNaN(parsed) ? 0 : parsed;
        });

        const maxSeq = Math.max(...sequenceNumbers, 0);
        const nextSeq = maxSeq + 1;
        const nextSeqStr = nextSeq.toString().padStart(2, '0');

        return `${prefixWithDot}${nextSeqStr}`;
    };

    const getParentAccountName = (kodeAkun: string): string => {
        const parts = kodeAkun.split('.');
        if (parts.length >= 3) {
            const prefix = parts.slice(0, 3).join('.');
            const parent = parentCoas.find((p) => p.kode_akun === prefix);
            if (parent) {
                return parent.nama_akun;
            }
            return prefix;
        }
        return '-';
    };
    const { data, setData, post, processing, errors, reset } = useForm({
        kode_akun: '',
        nama_akun: '',
        kategori: 'aset' as Coa['kategori'],
        saldo_normal: 'debit' as Coa['saldo_normal'],
        jenis_laporan: 'LPK' as Coa['jenis_laporan'],
    });

    // Edit Form
    const editForm = useForm({
        kode_akun: '',
        nama_akun: '',
        kategori: 'aset' as Coa['kategori'],
        saldo_normal: 'debit' as Coa['saldo_normal'],
        jenis_laporan: 'LPK' as Coa['jenis_laporan'],
    });

    // Auto-update code and fields when modal Level 3 is selected
    useEffect(() => {
        if (isOpen && modalLevel3) {
            const parent = parentCoas.find((p) => p.kode_akun === modalLevel3);
            if (parent) {
                const nextCode = generateNextKodeAkun(modalLevel3);
                setData((prev) => ({
                    ...prev,
                    kode_akun: nextCode,
                    kategori: parent.kategori,
                    saldo_normal: parent.saldo_normal,
                    jenis_laporan: parent.jenis_laporan,
                }));
            }
        }
        if (isOpen && !modalLevel3) {
            setData((prev) => ({ ...prev, kode_akun: '', kategori: 'aset', saldo_normal: 'debit', jenis_laporan: 'LPK' }));
        }
    }, [modalLevel3, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('coas.store'), {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                resetModalLevels();
            },
        });
    };

    const handleOpenEdit = (coa: Coa) => {
        setSelectedCoa(coa);
        editForm.setData({
            kode_akun: coa.kode_akun,
            nama_akun: coa.nama_akun,
            kategori: coa.kategori,
            saldo_normal: coa.saldo_normal,
            jenis_laporan: coa.jenis_laporan,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCoa) return;

        editForm.put(route('coas.update', selectedCoa.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedCoa(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
            editForm.delete(route('coas.destroy', id));
        }
    };



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chart of Accounts (COA)" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts (COA)</h1>
                        <p className="text-muted-foreground text-sm">
                            Kelola daftar akun untuk mencatat transaksi keuangan organisasi Anda secara terstruktur.
                        </p>
                    </div>
                    <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Akun
                    </Button>
                </div>

                {/* Filter Bar */}
                <div className="bg-card grid grid-cols-1 items-end gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Search - Row 1, Spans 2 cols */}
                    <div className="relative grid gap-1.5 sm:col-span-2 lg:col-span-2">
                        <Label htmlFor="search">Cari Akun</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                            <Input
                                id="search"
                                placeholder="Cari nama atau kode akun..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-9"
                            />
                        </div>
                    </div>

                    {/* Level 1 Filter - Row 1, Spans 1 col */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="level1_filter">Kelompok Utama</Label>
                        <select
                            id="level1_filter"
                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                            value={level1Filter}
                            onChange={(e) => {
                                setLevel1Filter(e.target.value);
                                setLevel2Filter('all');
                                setLevel3Filter('all');
                            }}
                        >
                            <option value="all">Semua</option>
                            {level1Parents.map((p) => (
                                <option key={p.id} value={p.kode_akun}>{p.nama_akun}</option>
                            ))}
                        </select>
                    </div>

                    {/* Level 2 Filter - Row 1, Spans 1 col */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="level2_filter">Sub Kelompok</Label>
                        <select
                            id="level2_filter"
                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                            value={level2Filter}
                            disabled={level2Options.length === 0}
                            onChange={(e) => {
                                setLevel2Filter(e.target.value);
                                setLevel3Filter('all');
                            }}
                        >
                            <option value="all">Semua</option>
                            {level2Options.map((p) => (
                                <option key={p.id} value={p.kode_akun}>{p.nama_akun}</option>
                            ))}
                        </select>
                    </div>

                    {/* Level 3 Filter - Row 2, Spans 1 col */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="level3_filter">Sub-Sub Kelompok</Label>
                        <select
                            id="level3_filter"
                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                            value={level3Filter}
                            disabled={level3Options.length === 0}
                            onChange={(e) => setLevel3Filter(e.target.value)}
                        >
                            <option value="all">Semua</option>
                            {level3Options.map((p) => (
                                <option key={p.id} value={p.kode_akun}>{p.nama_akun}</option>
                            ))}
                        </select>
                    </div>

                    {/* Saldo Normal - Row 2, Spans 1 col */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="saldo_filter">Saldo Normal</Label>
                        <select
                            id="saldo_filter"
                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                            value={saldoFilter}
                            onChange={(e) => setSaldoFilter(e.target.value)}
                        >
                            <option value="all">Semua Saldo</option>
                            <option value="debit">Debit</option>
                            <option value="kredit">Kredit</option>
                        </select>
                    </div>

                    {/* Jenis Laporan - Row 2, Spans 1 col */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="laporan_filter">Jenis Laporan</Label>
                        <select
                            id="laporan_filter"
                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                            value={laporanFilter}
                            onChange={(e) => setLaporanFilter(e.target.value)}
                        >
                            <option value="all">Semua Laporan</option>
                            <option value="LPK">Neraca (LPK)</option>
                            <option value="LR">Laba Rugi (LR)</option>
                        </select>
                    </div>

                    {/* Count & Reset Widget - Row 2, Spans 1 col */}
                    <div className="flex h-9 items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-1 text-xs">
                        <span className="text-muted-foreground whitespace-nowrap">
                            Menampilkan{' '}
                            <span className="text-foreground font-semibold">
                                {transactionCoas.filter((c) => {
                                    const prefix = level3Filter !== 'all' ? level3Filter
                                        : level2Filter !== 'all' ? level2Filter
                                            : level1Filter !== 'all' ? level1Filter
                                                : null;
                                    if (prefix && !c.kode_akun.startsWith(prefix + '.')) return false;
                                    if (saldoFilter !== 'all' && c.saldo_normal !== saldoFilter) return false;
                                    if (laporanFilter !== 'all' && c.jenis_laporan !== laporanFilter) return false;
                                    if (searchQuery.trim() !== '') {
                                        const q = searchQuery.toLowerCase();
                                        return c.nama_akun.toLowerCase().includes(q) || c.kode_akun.toLowerCase().includes(q);
                                    }
                                    return true;
                                }).length}
                            </span>{' '}
                            dari <span className="text-foreground font-semibold">{transactionCoas.length}</span>
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground cursor-pointer disabled:cursor-default transition-colors flex items-center gap-1 font-medium"
                            onClick={() => {
                                setSearchQuery('');
                                setLevel1Filter('all');
                                setLevel2Filter('all');
                                setLevel3Filter('all');
                                setSaldoFilter('all');
                                setLaporanFilter('all');
                            }}
                            disabled={searchQuery === '' && level1Filter === 'all' && level2Filter === 'all' && level3Filter === 'all' && saldoFilter === 'all' && laporanFilter === 'all'}
                        >
                            <X className="h-3 w-3" />
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-card w-full overflow-hidden rounded-xl border shadow-xs">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[800px] border-collapse text-left">
                            <thead>
                                <tr className="bg-muted/40 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                                    <th className="px-6 py-4">Kode Akun</th>
                                    <th className="px-6 py-4">Nama Akun</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Saldo Normal</th>
                                    <th className="px-6 py-4">Jenis Laporan</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {transactionCoas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-muted-foreground px-6 py-16 text-center">
                                            <Search className="text-muted-foreground/35 mx-auto mb-3 h-10 w-10" />
                                            <h4 className="text-foreground text-base font-semibold">Tidak Ada Hasil Cocok</h4>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                Coba sesuaikan kata kunci pencarian atau bersihkan filter Anda.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactionCoas.filter((coa) => {
                                        const prefix = level3Filter !== 'all' ? level3Filter
                                            : level2Filter !== 'all' ? level2Filter
                                                : level1Filter !== 'all' ? level1Filter
                                                    : null;
                                        if (prefix && !coa.kode_akun.startsWith(prefix + '.')) return false;
                                        if (saldoFilter !== 'all' && coa.saldo_normal !== saldoFilter) return false;
                                        if (laporanFilter !== 'all' && coa.jenis_laporan !== laporanFilter) return false;
                                        if (searchQuery.trim() !== '') {
                                            const query = searchQuery.toLowerCase();
                                            return coa.nama_akun.toLowerCase().includes(query) || coa.kode_akun.toLowerCase().includes(query);
                                        }
                                        return true;
                                    }).map((coa) => (
                                        <tr key={coa.id} className="hover:bg-muted/30 border-b last:border-0 transition-colors">
                                            <td className="text-foreground py-4 px-6 font-mono font-bold">{coa.kode_akun}</td>
                                            <td className="text-foreground py-4 px-6 font-medium">{coa.nama_akun}</td>
                                            <td className="text-muted-foreground py-4 px-6 capitalize">
                                                {KATEGORI_LABELS[coa.kategori]}
                                            </td>
                                            <td className="text-muted-foreground py-4 px-6 capitalize">
                                                {SALDO_LABELS[coa.saldo_normal]}
                                            </td>
                                            <td className="text-muted-foreground py-4 px-6">
                                                {JENIS_LAPORAN_LABELS[coa.jenis_laporan] || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                                                        onClick={() => handleOpenEdit(coa)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                                        onClick={() => handleDelete(coa.id)}
                                                        title="Hapus Akun"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create COA Dialog */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { reset(); resetModalLevels(); }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Akun Baru</DialogTitle>
                            <DialogDescription>
                                Pilih kelompok akun terlebih dahulu, lalu isi nama akun.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Level 1 */}
                            <div className="grid gap-2">
                                <Label htmlFor="modal_level1">Kelompok Utama <span className="text-red-500">*</span></Label>
                                <select
                                    id="modal_level1"
                                    className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                    value={modalLevel1}
                                    onChange={(e) => {
                                        setModalLevel1(e.target.value);
                                        setModalLevel2('');
                                        setModalLevel3('');
                                    }}
                                >
                                    <option value="">-- Pilih Kelompok Utama --</option>
                                    {level1Parents.map((p) => (
                                        <option key={p.id} value={p.kode_akun}>{p.nama_akun}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Level 2 */}
                            <div className="grid gap-2">
                                <Label htmlFor="modal_level2" className={!modalLevel1 ? 'text-muted-foreground' : ''}>
                                    Sub Kelompok <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    id="modal_level2"
                                    className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={modalLevel2}
                                    disabled={!modalLevel1}
                                    onChange={(e) => {
                                        setModalLevel2(e.target.value);
                                        setModalLevel3('');
                                    }}
                                >
                                    <option value="">-- Pilih Sub Kelompok --</option>
                                    {modalLevel2Options.map((p) => (
                                        <option key={p.id} value={p.kode_akun}>{p.nama_akun}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Level 3 */}
                            <div className="grid gap-2">
                                <Label htmlFor="modal_level3" className={!modalLevel2 ? 'text-muted-foreground' : ''}>
                                    Sub-Sub Kelompok <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    id="modal_level3"
                                    className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={modalLevel3}
                                    disabled={!modalLevel2}
                                    onChange={(e) => setModalLevel3(e.target.value)}
                                >
                                    <option value="">-- Pilih Sub-Sub Kelompok --</option>
                                    {modalLevel3Options.map((p) => (
                                        <option key={p.id} value={p.kode_akun}>{p.nama_akun}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Info auto-fill - tampil setelah Level 3 dipilih */}
                            {modalLevel3 && (
                                <div className="bg-muted/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-2.5 text-xs">
                                    <span className="text-muted-foreground">Kategori:</span>
                                    <span className="font-semibold">{KATEGORI_LABELS[data.kategori]}</span>
                                    <span className="text-muted-foreground/50">·</span>
                                    <span className="text-muted-foreground">Saldo:</span>
                                    <span className="font-semibold">{SALDO_LABELS[data.saldo_normal]}</span>
                                    <span className="text-muted-foreground/50">·</span>
                                    <span className="text-muted-foreground">Laporan:</span>
                                    <span className="font-semibold">{JENIS_LAPORAN_LABELS[data.jenis_laporan] || '-'}</span>
                                </div>
                            )}

                            {/* Nama Akun */}
                            <div className="grid gap-2">
                                <Label htmlFor="nama_akun" className={!modalLevel3 ? 'text-muted-foreground' : ''}>Nama Akun</Label>
                                <Input
                                    id="nama_akun"
                                    placeholder="Contoh: Kas Baru, Beban Operasi Lain"
                                    value={data.nama_akun}
                                    onChange={(e) => setData('nama_akun', e.target.value)}
                                    disabled={!modalLevel3}
                                    required
                                />
                                {errors.nama_akun && <span className="text-xs text-red-500">{errors.nama_akun}</span>}
                            </div>

                            {/* Kode Akun */}
                            <div className="grid gap-2">
                                <Label htmlFor="kode_akun" className={!modalLevel3 ? 'text-muted-foreground' : ''}>Kode Akun</Label>
                                <Input
                                    id="kode_akun"
                                    placeholder="Contoh: 01.1000.01.01"
                                    value={data.kode_akun}
                                    onChange={(e) => setData('kode_akun', e.target.value)}
                                    disabled={!modalLevel3}
                                    required
                                />
                                {data.kode_akun && !/^\d{2}\.\d{4}\.\d{2}\.\d{2}$/.test(data.kode_akun) && (
                                    <span className="text-amber-500 text-xs">⚠ Format: XX.XXXX.XX.XX (contoh: 01.1000.01.01)</span>
                                )}
                                {errors.kode_akun && <span className="text-xs text-red-500">{errors.kode_akun}</span>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setIsOpen(false); reset(); resetModalLevels(); }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing || !modalLevel3}>
                                Simpan Akun
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit COA Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Edit Detail Akun</DialogTitle>
                            <DialogDescription>Perbarui rincian untuk akun keuangan terpilih.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Kode Akun */}
                            <div className="grid gap-2">
                                <Label htmlFor="edit_kode_akun">Kode Akun</Label>
                                <Input
                                    id="edit_kode_akun"
                                    value={editForm.data.kode_akun}
                                    onChange={(e) => editForm.setData('kode_akun', e.target.value)}
                                    required
                                />
                                {editForm.errors.kode_akun && <span className="text-xs text-red-500">{editForm.errors.kode_akun}</span>}
                            </div>

                            {/* Nama Akun */}
                            <div className="grid gap-2">
                                <Label htmlFor="edit_nama_akun">Nama Akun</Label>
                                <Input
                                    id="edit_nama_akun"
                                    value={editForm.data.nama_akun}
                                    onChange={(e) => editForm.setData('nama_akun', e.target.value)}
                                    required
                                />
                                {editForm.errors.nama_akun && <span className="text-xs text-red-500">{editForm.errors.nama_akun}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Kategori */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_kategori">Kategori Akun</Label>
                                    <select
                                        id="edit_kategori"
                                        className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                        value={editForm.data.kategori}
                                        onChange={(e) => editForm.setData('kategori', e.target.value as Coa['kategori'])}
                                    >
                                        <option value="aset">Aset / Harta</option>
                                        <option value="kewajiban">Kewajiban / Utang</option>
                                        <option value="ekuitas">Ekuitas / Modal</option>
                                        <option value="pendapatan">Pendapatan</option>
                                        <option value="beban">Beban</option>
                                    </select>
                                    {editForm.errors.kategori && <span className="text-xs text-red-500">{editForm.errors.kategori}</span>}
                                </div>

                                {/* Saldo Normal */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_saldo_normal">Saldo Normal</Label>
                                    <select
                                        id="edit_saldo_normal"
                                        className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                        value={editForm.data.saldo_normal}
                                        onChange={(e) => editForm.setData('saldo_normal', e.target.value as Coa['saldo_normal'])}
                                    >
                                        <option value="debit">Debit</option>
                                        <option value="kredit">Kredit</option>
                                    </select>
                                    {editForm.errors.saldo_normal && <span className="text-xs text-red-500">{editForm.errors.saldo_normal}</span>}
                                </div>

                                {/* Jenis Laporan */}
                                <div className="col-span-2 grid gap-2">
                                    <Label htmlFor="edit_jenis_laporan">Jenis Laporan</Label>
                                    <select
                                        id="edit_jenis_laporan"
                                        className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                        value={editForm.data.jenis_laporan}
                                        onChange={(e) => editForm.setData('jenis_laporan', e.target.value as Coa['jenis_laporan'])}
                                    >
                                        <option value="LPK">Laporan Posisi Keuangan (Neraca)</option>
                                        <option value="LR">Laba Rugi</option>
                                    </select>
                                    {editForm.errors.jenis_laporan && <span className="text-xs text-red-500">{editForm.errors.jenis_laporan}</span>}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditOpen(false);
                                    setSelectedCoa(null);
                                    editForm.reset();
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
