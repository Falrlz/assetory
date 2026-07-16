import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
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
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(dateString));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accounting Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Accounting Settings"
                        description="Manage your accounting period restrictions and data locking parameters."
                    />

                    <div className="bg-card rounded-xl border p-5 space-y-4 max-w-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-neutral-500">Status Pembukuan</span>
                            {lockDate ? (
                                <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                    Terkunci
                                </span>
                            ) : (
                                <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                    Terbuka
                                </span>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Tanggal Penguncian Periode</Label>
                            <div className="text-lg font-bold text-foreground">
                                {lockDate ? formatDate(lockDate) : 'Belum Ada Periode Terkunci'}
                            </div>
                        </div>

                        <p className="text-xs text-neutral-500 leading-relaxed border-t pt-3">
                            {lockDate ? (
                                `Transaksi jurnal sebelum atau pada tanggal ${formatDate(lockDate)} telah dikunci secara otomatis oleh sistem di akhir tahun buku. Transaksi dalam periode yang dikunci tidak dapat ditambah, diubah, atau dihapus langsung (harus melalui Jurnal Pembalik).`
                            ) : (
                                "Pembukuan saat ini terbuka secara penuh. Periode pembukuan akan dikunci secara otomatis per tanggal 31 Desember tahun sebelumnya oleh sistem scheduler setiap kali memasuki tahun buku baru."
                            )}
                        </p>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
