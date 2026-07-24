import { Field, FilterBar, PageHeader, PageShell } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableContainer, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Coa } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
    LPK: 'Laporan Posisi Keuangan (LPK)',
    LR: 'Laba Rugi (LR)',
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
    const level2Options =
        level1Filter !== 'all'
            ? parentCoas.filter((p) => p.kode_akun.split('.').length === 2 && p.kode_akun.startsWith(level1Filter + '.'))
            : parentCoas.filter((p) => p.kode_akun.split('.').length === 2);
    const level3Options =
        level2Filter !== 'all'
            ? parentCoas.filter((p) => p.kode_akun.split('.').length === 3 && p.kode_akun.startsWith(level2Filter + '.'))
            : level1Filter !== 'all'
              ? parentCoas.filter((p) => p.kode_akun.split('.').length === 3 && p.kode_akun.startsWith(level1Filter + '.'))
              : parentCoas.filter((p) => p.kode_akun.split('.').length === 3);

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

    const generateNextKodeAkun = useCallback(
        (kelompokPrefix: string): string => {
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
        },
        [transactionCoas],
    );

    /** Single source of truth for both the result count and the table rows. */
    const filteredCoas = useMemo(() => {
        const prefix = level3Filter !== 'all' ? level3Filter : level2Filter !== 'all' ? level2Filter : level1Filter !== 'all' ? level1Filter : null;
        const query = searchQuery.trim().toLowerCase();

        return transactionCoas.filter((coa) => {
            if (prefix && !coa.kode_akun.startsWith(prefix + '.')) return false;
            if (saldoFilter !== 'all' && coa.saldo_normal !== saldoFilter) return false;
            if (laporanFilter !== 'all' && coa.jenis_laporan !== laporanFilter) return false;
            if (query !== '') {
                return coa.nama_akun.toLowerCase().includes(query) || coa.kode_akun.toLowerCase().includes(query);
            }
            return true;
        });
    }, [transactionCoas, level1Filter, level2Filter, level3Filter, saldoFilter, laporanFilter, searchQuery]);

    const isFilterActive =
        searchQuery !== '' ||
        level1Filter !== 'all' ||
        level2Filter !== 'all' ||
        level3Filter !== 'all' ||
        saldoFilter !== 'all' ||
        laporanFilter !== 'all';

    const handleResetFilters = () => {
        setSearchQuery('');
        setLevel1Filter('all');
        setLevel2Filter('all');
        setLevel3Filter('all');
        setSaldoFilter('all');
        setLaporanFilter('all');
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
    }, [modalLevel3, isOpen, generateNextKodeAkun, parentCoas, setData]);

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

            <PageShell>
                <PageHeader
                    title="Chart of Accounts (COA)"
                    description="Kelola daftar akun untuk mencatat transaksi keuangan organisasi Anda secara terstruktur."
                    actions={
                        <Button onClick={() => setIsOpen(true)}>
                            <Plus />
                            Tambah Akun
                        </Button>
                    }
                />

                {/* Filter Bar */}
                <FilterBar className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                    <Field className="sm:col-span-2">
                        <Label htmlFor="search">Cari Akun</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                id="search"
                                inputSize="sm"
                                placeholder="Cari nama atau kode akun..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </Field>

                    <Field>
                        <Label htmlFor="level1_filter">Kelompok Utama</Label>
                        <NativeSelect
                            id="level1_filter"
                            selectSize="sm"
                            value={level1Filter}
                            onChange={(e) => {
                                setLevel1Filter(e.target.value);
                                setLevel2Filter('all');
                                setLevel3Filter('all');
                            }}
                        >
                            <option value="all">Semua</option>
                            {level1Parents.map((p) => (
                                <option key={p.id} value={p.kode_akun}>
                                    {p.nama_akun}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>

                    <Field>
                        <Label htmlFor="level2_filter">Sub Kelompok</Label>
                        <NativeSelect
                            id="level2_filter"
                            selectSize="sm"
                            value={level2Filter}
                            disabled={level2Options.length === 0}
                            onChange={(e) => {
                                setLevel2Filter(e.target.value);
                                setLevel3Filter('all');
                            }}
                        >
                            <option value="all">Semua</option>
                            {level2Options.map((p) => (
                                <option key={p.id} value={p.kode_akun}>
                                    {p.nama_akun}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>

                    <Field>
                        <Label htmlFor="level3_filter">Sub-Sub Kelompok</Label>
                        <NativeSelect
                            id="level3_filter"
                            selectSize="sm"
                            value={level3Filter}
                            disabled={level3Options.length === 0}
                            onChange={(e) => setLevel3Filter(e.target.value)}
                        >
                            <option value="all">Semua</option>
                            {level3Options.map((p) => (
                                <option key={p.id} value={p.kode_akun}>
                                    {p.nama_akun}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>

                    <Field>
                        <Label htmlFor="saldo_filter">Saldo Normal</Label>
                        <NativeSelect id="saldo_filter" selectSize="sm" value={saldoFilter} onChange={(e) => setSaldoFilter(e.target.value)}>
                            <option value="all">Semua Saldo</option>
                            <option value="debit">Debit</option>
                            <option value="kredit">Kredit</option>
                        </NativeSelect>
                    </Field>

                    <Field>
                        <Label htmlFor="laporan_filter">Jenis Laporan</Label>
                        <NativeSelect id="laporan_filter" selectSize="sm" value={laporanFilter} onChange={(e) => setLaporanFilter(e.target.value)}>
                            <option value="all">Semua Laporan</option>
                            <option value="LPK">Neraca (LPK)</option>
                            <option value="LR">Laba Rugi (LR)</option>
                        </NativeSelect>
                    </Field>

                    <div className="flex items-center justify-between gap-3 border-t pt-3 sm:col-span-2 lg:col-span-3 2xl:col-span-6">
                        <p className="text-muted-foreground text-sm">
                            Menampilkan <span className="text-foreground font-semibold tabular-nums">{filteredCoas.length}</span> dari{' '}
                            <span className="text-foreground font-semibold tabular-nums">{transactionCoas.length}</span> akun transaksi
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={handleResetFilters}
                            disabled={!isFilterActive}
                        >
                            <X />
                            Reset Filter
                        </Button>
                    </div>
                </FilterBar>

                {/* Table Section */}
                <TableContainer>
                    <Table minWidth="min-w-[900px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-44">Kode Akun</TableHead>
                                <TableHead className="min-w-[220px]">Nama Akun</TableHead>
                                <TableHead className="w-44">Kategori</TableHead>
                                <TableHead align="center" className="w-36">
                                    Saldo Normal
                                </TableHead>
                                <TableHead className="w-56">Jenis Laporan</TableHead>
                                <TableHead align="center" className="w-28">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCoas.length === 0 ? (
                                <TableEmpty
                                    colSpan={6}
                                    icon={<Search className="text-muted-foreground/40 mb-1 size-10" />}
                                    title="Tidak Ada Hasil Cocok"
                                    description="Coba sesuaikan kata kunci pencarian atau bersihkan filter Anda."
                                />
                            ) : (
                                filteredCoas.map((coa) => (
                                    <TableRow key={coa.id}>
                                        <TableCell className="text-foreground font-mono font-semibold">{coa.kode_akun}</TableCell>
                                        <TableCell className="text-foreground font-medium">{coa.nama_akun}</TableCell>
                                        <TableCell className="text-muted-foreground">{KATEGORI_LABELS[coa.kategori]}</TableCell>
                                        <TableCell align="center">
                                            <Badge variant={coa.saldo_normal === 'debit' ? 'info' : 'accent'}>{SALDO_LABELS[coa.saldo_normal]}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{JENIS_LAPORAN_LABELS[coa.jenis_laporan] || '-'}</TableCell>
                                        <TableCell align="center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    className="text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleOpenEdit(coa)}
                                                    title="Ubah akun"
                                                >
                                                    <Edit />
                                                    <span className="sr-only">Ubah akun</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDelete(coa.id)}
                                                    title="Hapus akun"
                                                >
                                                    <Trash2 />
                                                    <span className="sr-only">Hapus akun</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </PageShell>

            {/* Create COA Dialog */}
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        reset();
                        resetModalLevels();
                    }
                }}
            >
                <DialogContent className="sm:max-w-[520px]">
                    <form onSubmit={handleSubmit} className="grid gap-6">
                        <DialogHeader>
                            <DialogTitle>Tambah Akun Baru</DialogTitle>
                            <DialogDescription>Pilih kelompok akun terlebih dahulu, lalu isi nama akun.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <Field>
                                <Label htmlFor="modal_level1">
                                    Kelompok Utama <span className="text-destructive">*</span>
                                </Label>
                                <NativeSelect
                                    id="modal_level1"
                                    value={modalLevel1}
                                    onChange={(e) => {
                                        setModalLevel1(e.target.value);
                                        setModalLevel2('');
                                        setModalLevel3('');
                                    }}
                                >
                                    <option value="">-- Pilih Kelompok Utama --</option>
                                    {level1Parents.map((p) => (
                                        <option key={p.id} value={p.kode_akun}>
                                            {p.nama_akun}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>

                            <Field>
                                <Label htmlFor="modal_level2" className={!modalLevel1 ? 'text-muted-foreground' : ''}>
                                    Sub Kelompok <span className="text-destructive">*</span>
                                </Label>
                                <NativeSelect
                                    id="modal_level2"
                                    value={modalLevel2}
                                    disabled={!modalLevel1}
                                    onChange={(e) => {
                                        setModalLevel2(e.target.value);
                                        setModalLevel3('');
                                    }}
                                >
                                    <option value="">-- Pilih Sub Kelompok --</option>
                                    {modalLevel2Options.map((p) => (
                                        <option key={p.id} value={p.kode_akun}>
                                            {p.nama_akun}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>

                            <Field>
                                <Label htmlFor="modal_level3" className={!modalLevel2 ? 'text-muted-foreground' : ''}>
                                    Sub-Sub Kelompok <span className="text-destructive">*</span>
                                </Label>
                                <NativeSelect
                                    id="modal_level3"
                                    value={modalLevel3}
                                    disabled={!modalLevel2}
                                    onChange={(e) => setModalLevel3(e.target.value)}
                                >
                                    <option value="">-- Pilih Sub-Sub Kelompok --</option>
                                    {modalLevel3Options.map((p) => (
                                        <option key={p.id} value={p.kode_akun}>
                                            {p.nama_akun}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>

                            {/* Info auto-fill - tampil setelah Level 3 dipilih */}
                            {modalLevel3 && (
                                <dl className="bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border px-4 py-3 text-xs">
                                    {[
                                        ['Kategori', KATEGORI_LABELS[data.kategori]],
                                        ['Saldo', SALDO_LABELS[data.saldo_normal]],
                                        ['Laporan', JENIS_LAPORAN_LABELS[data.jenis_laporan] || '-'],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex items-center gap-1.5">
                                            <dt className="text-muted-foreground">{label}:</dt>
                                            <dd className="text-foreground font-semibold">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            )}

                            <Field>
                                <Label htmlFor="nama_akun" className={!modalLevel3 ? 'text-muted-foreground' : ''}>
                                    Nama Akun
                                </Label>
                                <Input
                                    id="nama_akun"
                                    placeholder="Contoh: Kas Baru, Beban Operasi Lain"
                                    value={data.nama_akun}
                                    onChange={(e) => setData('nama_akun', e.target.value)}
                                    disabled={!modalLevel3}
                                    required
                                />
                                {errors.nama_akun && <p className="text-destructive text-xs font-medium">{errors.nama_akun}</p>}
                            </Field>

                            <Field>
                                <Label htmlFor="kode_akun" className={!modalLevel3 ? 'text-muted-foreground' : ''}>
                                    Kode Akun
                                </Label>
                                <Input
                                    id="kode_akun"
                                    placeholder="Contoh: 01.1000.01.01"
                                    value={data.kode_akun}
                                    onChange={(e) => setData('kode_akun', e.target.value)}
                                    disabled={!modalLevel3}
                                    className="font-mono"
                                    required
                                />
                                {data.kode_akun && !/^\d{2}\.\d{4}\.\d{2}\.\d{2}$/.test(data.kode_akun) && (
                                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                        Format: XX.XXXX.XX.XX (contoh: 01.1000.01.01)
                                    </p>
                                )}
                                {errors.kode_akun && <p className="text-destructive text-xs font-medium">{errors.kode_akun}</p>}
                            </Field>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsOpen(false);
                                    reset();
                                    resetModalLevels();
                                }}
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
                <DialogContent className="sm:max-w-[520px]">
                    <form onSubmit={handleUpdate} className="grid gap-6">
                        <DialogHeader>
                            <DialogTitle>Edit Detail Akun</DialogTitle>
                            <DialogDescription>Perbarui rincian untuk akun keuangan terpilih.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <Field>
                                <Label htmlFor="edit_kode_akun">Kode Akun</Label>
                                <Input
                                    id="edit_kode_akun"
                                    value={editForm.data.kode_akun}
                                    onChange={(e) => editForm.setData('kode_akun', e.target.value)}
                                    className="font-mono"
                                    required
                                />
                                {editForm.errors.kode_akun && <p className="text-destructive text-xs font-medium">{editForm.errors.kode_akun}</p>}
                            </Field>

                            <Field>
                                <Label htmlFor="edit_nama_akun">Nama Akun</Label>
                                <Input
                                    id="edit_nama_akun"
                                    value={editForm.data.nama_akun}
                                    onChange={(e) => editForm.setData('nama_akun', e.target.value)}
                                    required
                                />
                                {editForm.errors.nama_akun && <p className="text-destructive text-xs font-medium">{editForm.errors.nama_akun}</p>}
                            </Field>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field>
                                    <Label htmlFor="edit_kategori">Kategori Akun</Label>
                                    <NativeSelect
                                        id="edit_kategori"
                                        value={editForm.data.kategori}
                                        onChange={(e) => editForm.setData('kategori', e.target.value as Coa['kategori'])}
                                    >
                                        {Object.entries(KATEGORI_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    {editForm.errors.kategori && <p className="text-destructive text-xs font-medium">{editForm.errors.kategori}</p>}
                                </Field>

                                <Field>
                                    <Label htmlFor="edit_saldo_normal">Saldo Normal</Label>
                                    <NativeSelect
                                        id="edit_saldo_normal"
                                        value={editForm.data.saldo_normal}
                                        onChange={(e) => editForm.setData('saldo_normal', e.target.value as Coa['saldo_normal'])}
                                    >
                                        <option value="debit">Debit</option>
                                        <option value="kredit">Kredit</option>
                                    </NativeSelect>
                                    {editForm.errors.saldo_normal && (
                                        <p className="text-destructive text-xs font-medium">{editForm.errors.saldo_normal}</p>
                                    )}
                                </Field>

                                <Field className="sm:col-span-2">
                                    <Label htmlFor="edit_jenis_laporan">Jenis Laporan</Label>
                                    <NativeSelect
                                        id="edit_jenis_laporan"
                                        value={editForm.data.jenis_laporan}
                                        onChange={(e) => editForm.setData('jenis_laporan', e.target.value as Coa['jenis_laporan'])}
                                    >
                                        <option value="LPK">Laporan Posisi Keuangan (Neraca)</option>
                                        <option value="LR">Laba Rugi</option>
                                    </NativeSelect>
                                    {editForm.errors.jenis_laporan && (
                                        <p className="text-destructive text-xs font-medium">{editForm.errors.jenis_laporan}</p>
                                    )}
                                </Field>
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
