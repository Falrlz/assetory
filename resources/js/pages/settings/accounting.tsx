import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        lock_date: lockDate || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('settings.accounting.update'));
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

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="lock_date">Period Lock Date</Label>

                            <Input
                                id="lock_date"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.lock_date}
                                onChange={(e) => setData('lock_date', e.target.value)}
                            />

                            <p className="text-xs text-neutral-500 mt-1">
                                Transaksi jurnal sebelum atau pada tanggal ini akan otomatis dikunci. Jurnal dalam periode yang dikunci tidak dapat ditambah, diubah, atau dihapus langsung (harus melalui Jurnal Pembalik). Kosongkan kolom untuk menonaktifkan penguncian.
                            </p>

                            <InputError className="mt-2" message={errors.lock_date} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save Settings</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
