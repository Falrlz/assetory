<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EquityChangeController extends Controller
{
    /**
     * Display the Statement of Changes in Equity (Laporan Perubahan Ekuitas).
     */
    public function equityChange(Request $request): Response
    {
        $user = $request->user();

        $request->validate([
            'year' => 'nullable|numeric|digits:4',
        ]);

        $yearInput = $request->input('year');

        if (! $yearInput) {
            return Inertia::render('reports/equity-change', [
                'equityItems' => [],
                'totalAwal' => 0,
                'totalTambahan' => 0,
                'totalLabaNet' => 0,
                'totalAkhir' => 0,
                'hasAppliedFilter' => false,
                'filters' => [
                    'year' => '',
                ],
            ]);
        }

        $year = (int) $yearInput;
        $startDate = "{$year}-01-01";
        $endDate = "{$year}-12-31";

        // Get equity accounts (Prefix 03 or kategori ekuitas)
        $equityCoas = $user->coas()
            ->where(function ($query) {
                $query->where('kode_akun', 'LIKE', '03.%')
                    ->orWhere('kategori', 'ekuitas');
            })
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4)
            ->values();

        $equityData = [];
        $totalAwal = 0;
        $totalTambahan = 0;
        $totalLabaNet = 0;
        $totalAkhir = 0;

        // 1. Calculate Net Profit for current period
        $allCoasForPL = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->map(function ($coa) use ($user, $startDate, $endDate) {
                $sums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->whereBetween('journals.tanggal', [$startDate, $endDate])
                    ->where(function ($query) {
                        $query->whereNotIn('journals.jenis_transaksi', ['saldo_awal', 'jurnal_penutup'])
                            ->orWhereNull('journals.jenis_transaksi');
                    })
                    ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                    ->first();

                $coa->total_debit = (float) $sums->total_debit;
                $coa->total_kredit = (float) $sums->total_kredit;

                if ($coa->saldo_normal === 'debit') {
                    $coa->saldo = $coa->total_debit - $coa->total_kredit;
                } else {
                    $coa->saldo = $coa->total_kredit - $coa->total_debit;
                }

                return $coa;
            });

        $totalRevenues = $allCoasForPL->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '04.') || $coa->kategori === 'pendapatan') && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo');
        $totalExpenses = $allCoasForPL->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '05.') || $coa->kategori === 'beban') && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo');
        $netProfit = $totalRevenues - $totalExpenses;

        // Process each equity account
        foreach ($equityCoas as $coa) {
            // A. Opening balance (before start_date OR is setup beginning balance)
            $openingSums = DB::table('journal_items')
                ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                ->where('journals.user_id', $user->id)
                ->where('journal_items.coa_id', $coa->id)
                ->where(function ($query) use ($startDate) {
                    $query->where('journals.tanggal', '<', $startDate)
                        ->orWhere('journals.jenis_transaksi', 'saldo_awal');
                })
                ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                ->first();

            $balAwal = (float) $openingSums->total_kredit - (float) $openingSums->total_debit;

            // B. Additions (Modal Tambahan / changes during period, excluding setup beginning balance)
            // Exclude Saldo Laba (03.2000.02.01) and Laba Rugi Tahun Berjalan (03.2000.03.01) from manual additions
            $balTambahan = 0.00;
            if ($coa->kode_akun !== '03.2000.02.01' && $coa->kode_akun !== '03.2000.03.01') {
                $periodSums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->whereBetween('journals.tanggal', [$startDate, $endDate])
                    ->where(function ($query) {
                        $query->whereNotIn('journals.jenis_transaksi', ['saldo_awal', 'jurnal_penutup'])
                            ->orWhereNull('journals.jenis_transaksi');
                    })
                    ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                    ->first();
                $balTambahan = (float) $periodSums->total_kredit - (float) $periodSums->total_debit;
            }

            // C. Net Profit Addition (Specifically for Laba Rugi Tahun Berjalan account)
            $labaNet = 0.00;
            if ($coa->kode_akun === '03.2000.03.01') {
                $labaNet = $netProfit;
            }

            $balAkhir = $balAwal + $balTambahan + $labaNet;

            if ($balAwal != 0 || $balTambahan != 0 || $labaNet != 0 || $balAkhir != 0) {
                $equityData[] = [
                    'kode_akun' => $coa->kode_akun,
                    'nama_akun' => $coa->nama_akun,
                    'saldo_awal' => $balAwal,
                    'tambahan' => $balTambahan,
                    'laba_net' => $labaNet,
                    'saldo_akhir' => $balAkhir,
                ];

                $totalAwal += $balAwal;
                $totalTambahan += $balTambahan;
                $totalLabaNet += $labaNet;
                $totalAkhir += $balAkhir;
            }
        }

        return Inertia::render('reports/equity-change', [
            'equityItems' => $equityData,
            'totalAwal' => $totalAwal,
            'totalTambahan' => $totalTambahan,
            'totalLabaNet' => $totalLabaNet,
            'totalAkhir' => $totalAkhir,
            'hasAppliedFilter' => true,
            'filters' => [
                'year' => (string) $year,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
