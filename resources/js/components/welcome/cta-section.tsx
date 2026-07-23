import { Button } from '@/components/ui/button';
import { Section } from '@/components/welcome/container';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
    const { auth } = usePage<SharedData>().props;

    return (
        <Section>
            <div className="w-full rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-800 to-stone-900 px-6 py-12 text-center sm:px-12 sm:py-16 dark:from-neutral-950 dark:via-stone-900 dark:to-neutral-900">
                <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl lg:text-4xl">
                    Mulai kelola aset dan pembukuan hari ini
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-300 sm:text-base">
                    Chart of Accounts standar sudah tersedia otomatis untuk setiap akun baru, jadi Anda bisa langsung mencatat transaksi pertama.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    {auth.user ? (
                        <Button
                            asChild
                            size="lg"
                            className="bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:ring-white focus-visible:ring-offset-neutral-900"
                        >
                            <Link href={route('dashboard')}>
                                Buka Dashboard
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    ) : (
                        <>
                            <Button
                                asChild
                                size="lg"
                                className="bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:ring-white focus-visible:ring-offset-neutral-900"
                            >
                                <Link href={route('register')}>
                                    Buat Akun Gratis
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800 hover:text-white focus-visible:ring-white focus-visible:ring-offset-neutral-900"
                            >
                                <Link href={route('login')}>Masuk ke Akun</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Section>
    );
}
