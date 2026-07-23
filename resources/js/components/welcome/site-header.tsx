import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/welcome/container';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

const navLinks = [
    { label: 'Fitur', href: '#fitur' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
    { label: 'Laporan', href: '#laporan' },
];

export function SiteHeader() {
    const { auth } = usePage<SharedData>().props;

    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/85 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/85">
            <Container>
                <div className="flex h-16 items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-hidden dark:focus-visible:ring-neutral-100 dark:focus-visible:ring-offset-neutral-950"
                        aria-label="Assetory, kembali ke beranda"
                    >
                        <span className="flex size-8 items-center justify-center rounded-md bg-neutral-900 dark:bg-white">
                            <AppLogoIcon className="size-4 text-white dark:text-neutral-900" />
                        </span>
                        <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">Assetory</span>
                    </Link>

                    <nav aria-label="Navigasi utama" className="hidden items-center gap-8 md:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="rounded-sm text-sm font-medium text-neutral-600 transition-colors duration-200 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-4 focus-visible:ring-offset-white focus-visible:outline-hidden dark:text-neutral-400 dark:hover:text-white dark:focus-visible:ring-neutral-100 dark:focus-visible:ring-offset-neutral-950"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        {auth.user ? (
                            <Button asChild>
                                <Link href={route('dashboard')}>Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost">
                                    <Link href={route('login')}>Masuk</Link>
                                </Button>
                                <Button asChild>
                                    <Link href={route('register')}>Daftar</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Container>
        </header>
    );
}
