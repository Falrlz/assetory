import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting settings',
        href: '/settings/accounting',
    },
];

export default function Accounting({ lockDate }: { lockDate?: string }) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accounting Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Accounting Settings" description="Manage your accounting period restrictions and data locking parameters." />

                    <div className="bg-card max-w-xl space-y-4 rounded-xl border p-5 shadow-xs">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground text-sm font-medium">Status Pembukuan</span>
                            {lockDate ? <Badge variant="danger">Terkunci</Badge> : <Badge variant="success">Terbuka</Badge>}
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="text-muted-foreground text-xs tracking-wide uppercase">Tanggal Penguncian Periode</Label>
                            <p className="text-foreground font-mono text-lg font-bold tabular-nums">
                                {lockDate ? formatDate(lockDate) : 'Belum Ada Periode Terkunci'}
                            </p>
                        </div>

                        <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">
                            {lockDate
                                ? `Transaksi jurnal sebelum atau pada tanggal ${formatDate(lockDate)} telah dikunci secara otomatis oleh sistem di akhir tahun buku. Transaksi dalam periode yang dikunci tidak dapat ditambah, diubah, atau dihapus langsung (harus melalui Jurnal Pembalik).`
                                : 'Pembukuan saat ini terbuka secara penuh. Periode pembukuan akan dikunci secara otomatis per tanggal 31 Desember tahun sebelumnya oleh sistem scheduler setiap kali memasuki tahun buku baru.'}
                        </p>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
