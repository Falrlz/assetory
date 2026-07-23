import AppLogoIcon from '@/components/app-logo-icon';
import { Container } from '@/components/welcome/container';

const linkClass =
    'rounded-sm text-sm text-neutral-600 transition-colors duration-200 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-4 focus-visible:ring-offset-white focus-visible:outline-hidden dark:text-neutral-400 dark:hover:text-white dark:focus-visible:ring-neutral-100 dark:focus-visible:ring-offset-neutral-950';

const footerGroups = [
    {
        heading: 'Produk',
        links: [
            { label: 'Fitur', href: '#fitur' },
            { label: 'Cara Kerja', href: '#cara-kerja' },
            { label: 'Laporan', href: '#laporan' },
        ],
    },
    {
        heading: 'Sumber Daya',
        links: [
            { label: 'Dokumentasi Laravel', href: 'https://laravel.com/docs' },
            { label: 'Inertia.js', href: 'https://inertiajs.com' },
            { label: 'Repositori GitHub', href: 'https://github.com/Falrlz/assetory' },
        ],
    },
];

export function SiteFooter() {
    return (
        <footer className="py-12 sm:py-16">
            <Container>
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-md bg-neutral-900 dark:bg-white">
                                <AppLogoIcon className="size-4 text-white dark:text-neutral-900" aria-hidden="true" />
                            </span>
                            <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">Assetory</span>
                        </div>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                            Manajemen aset tetap dan akuntansi double-entry dengan kejelasan keuangan secara real-time.
                        </p>
                    </div>

                    {footerGroups.map((group) => (
                        <nav key={group.heading} aria-label={group.heading}>
                            <h2 className="text-xs font-semibold tracking-wide text-neutral-900 uppercase dark:text-white">{group.heading}</h2>
                            <ul className="mt-4 space-y-3">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className={linkClass}
                                            {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                <p className="mt-12 text-xs text-neutral-500 dark:text-neutral-400">
                    &copy; {new Date().getFullYear()} Assetory.
                </p>
            </Container>
        </footer>
    );
}
