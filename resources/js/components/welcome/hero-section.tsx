import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/welcome/container';
import { DashboardPreview } from '@/components/welcome/dashboard-preview';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

const highlights = [
    { value: '6', label: 'Laporan keuangan' },
    { value: '4', label: 'Golongan pajak aset' },
    { value: '100%', label: 'Jurnal seimbang' },
];

/** Shared entrance transition: fades and lifts once on first paint. */
const enter = 'transition-all duration-500 ease-out motion-reduce:transition-none starting:translate-y-3 starting:opacity-0';

export function HeroSection() {
    const { auth } = usePage<SharedData>().props;

    return (
        <Section>
            <div className="grid items-center gap-10 xl:grid-cols-2 xl:gap-16">
                <div className="max-w-xl mx-auto xl:mx-0 xl:scale-90 xl:origin-top-left 2xl:scale-100 2xl:origin-center">
                    <Badge variant="secondary" className={`gap-1.5 py-1 ${enter}`}>
                        <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        Aset tetap &amp; akuntansi double-entry
                    </Badge>

                    <h1
                        className={`mt-6 lg:mt-4 text-3xl leading-tight font-bold tracking-tight text-balance text-neutral-900 delay-75 sm:text-4xl lg:text-5xl dark:text-white ${enter}`}
                    >
                        Kelola aset dan pembukuan usaha dalam satu sistem
                    </h1>

                    <p className={`mt-5 lg:mt-3 text-base leading-relaxed text-neutral-600 delay-150 sm:text-lg dark:text-neutral-400 ${enter}`}>
                        Assetory menghitung penyusutan garis lurus secara otomatis, menjaga setiap jurnal tetap seimbang, dan menyusun laporan
                        keuangan lengkap secara real-time.
                    </p>

                    <div className={`mt-8 lg:mt-5 flex flex-col gap-3 delay-200 sm:flex-row sm:items-center ${enter}`}>
                        {auth.user ? (
                            <Button asChild size="lg">
                                <Link href={route('dashboard')}>
                                    Buka Dashboard
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="lg">
                                <Link href={route('register')}>
                                    Mulai Sekarang
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        )}
                        <Button asChild size="lg" variant="outline">
                            <a href="#fitur">Jelajahi Fitur</a>
                        </Button>
                    </div>

                    <dl className={`mt-10 lg:mt-6 grid grid-cols-3 gap-x-4 sm:gap-x-8 delay-300 ${enter}`}>
                        {highlights.map((item) => (
                            <div key={item.label}>
                                <dt className="sr-only">{item.label}</dt>
                                <dd className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{item.value}</dd>
                                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{item.label}</p>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className={`delay-200 mt-10 mx-auto max-w-2xl w-full xl:max-w-none xl:mx-0 xl:mt-0 xl:pl-4 xl:scale-90 xl:origin-top-right 2xl:scale-100 2xl:origin-center ${enter}`}>
                    <DashboardPreview />
                </div>
            </div>
        </Section>
    );
}
