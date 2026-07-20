import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BarChart3, BookOpen, Coins, LayoutGrid, Notebook, Scale } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Assets',
        url: '/assets',
        icon: Coins,
    },
    {
        title: 'Saldo Awal',
        url: '/beginning-balances',
        icon: Scale,
    },
    {
        title: 'Chart of Accounts',
        url: '/coas',
        icon: BookOpen,
    },
    {
        title: 'Journals & Ledger',
        url: '#',
        icon: Notebook,
        items: [
            {
                title: 'Jurnal Umum',
                url: '/journals',
            },
            {
                title: 'Buku Besar',
                url: '/journals?tab=ledger',
            },
            {
                title: 'Penyusutan Aset',
                url: '/journals?tab=depresiasi',
            },
            {
                title: 'Neraca Saldo',
                url: '/reports/trial-balance',
            },
        ],
    },
    {
        title: 'Laporan',
        url: '#',
        icon: BarChart3,
        items: [
            {
                title: 'Neraca Keuangan',
                url: '/reports/balance-sheet',
            },
            {
                title: 'Laba dan Rugi',
                url: '/reports/profit-loss',
            },
            {
                title: 'Arus Kas',
                url: '/reports/cash-flow',
            },
            {
                title: 'Perubahan Ekuitas',
                url: '/reports/equity-change',
            },
            {
                title: 'CALK',
                url: '/reports/calk',
            },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
