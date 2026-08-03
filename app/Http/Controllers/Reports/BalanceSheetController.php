<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BalanceSheetController extends Controller
{
    /**
     * Display the Balance Sheet (Neraca Keuangan).
     */
    public function balanceSheet(Request $request): Response
    {
        $user = $request->user();

        $request->validate([
            'year' => 'nullable|numeric|digits:4',
        ]);

        $yearInput = $request->input('year');

        if (! $yearInput) {
            return Inertia::render('reports/balance-sheet', [
                'assets' => [],
                'liabilities' => [],
                'equity' => [],
                'totalAssets' => 0,
                'totalAssetsLastYear' => 0,
                'totalLiabilities' => 0,
                'totalLiabilitiesLastYear' => 0,
                'totalEquity' => 0,
                'totalEquityLastYear' => 0,
                'totalLiabilitiesAndEquity' => 0,
                'totalLiabilitiesAndEquityLastYear' => 0,
                'hasAppliedFilter' => false,
                'filters' => [
                    'year' => '',
                ],
            ]);
        }

        $year = (int) $yearInput;
        $endDate = "{$year}-12-31";
        $prevYear = $year - 1;
        $prevEndDate = "{$prevYear}-12-31";

        // Get all accounts
        $allCoas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->map(function ($coa) use ($user, $endDate, $prevEndDate) {
                // Current Year
                $sums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->where('journals.tanggal', '<=', $endDate) // Cumulative since beginning
                    ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                    ->first();

                // Last Year
                $prevSums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->where('journals.tanggal', '<=', $prevEndDate) // Cumulative since beginning of last year
                    ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                    ->first();

                $coa->total_debit = (float) $sums->total_debit;
                $coa->total_kredit = (float) $sums->total_kredit;

                $coa->total_debit_last_year = (float) $prevSums->total_debit;
                $coa->total_kredit_last_year = (float) $prevSums->total_kredit;

                // Net balance Current Year
                if ($coa->saldo_normal === 'debit') {
                    $coa->saldo = $coa->total_debit - $coa->total_kredit;
                    $coa->saldo_last_year = $coa->total_debit_last_year - $coa->total_kredit_last_year;
                } else {
                    $coa->saldo = $coa->total_kredit - $coa->total_debit;
                    $coa->saldo_last_year = $coa->total_kredit_last_year - $coa->total_debit_last_year;
                }

                return $coa;
            });

        // Filter and group by Prefix Kode COA (01: Aset, 02: Kewajiban, 03: Ekuitas, 04: Pendapatan, 05: Beban)
        $assets = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '01.') || $coa->kategori === 'aset') && count(explode('.', $coa->kode_akun)) === 4)->values();
        $liabilities = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '02.') || $coa->kategori === 'kewajiban') && count(explode('.', $coa->kode_akun)) === 4)->values();
        $equity = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '03.') || $coa->kategori === 'ekuitas') && count(explode('.', $coa->kode_akun)) === 4)->values();

        // Calculate Net Income (Laba Rugi Tahun Berjalan) from Prefix 04 (Pendapatan) & 05 (Beban)
        $revenues = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '04.') || $coa->kategori === 'pendapatan') && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo');
        $expenses = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '05.') || $coa->kategori === 'beban') && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo');
        $currentEarnings = $revenues - $expenses;

        $revenuesLastYear = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '04.') || $coa->kategori === 'pendapatan') && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo_last_year');
        $expensesLastYear = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '05.') || $coa->kategori === 'beban') && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo_last_year');
        $currentEarningsLastYear = $revenuesLastYear - $expensesLastYear;

        // Assign current earnings to existing Laba Rugi Tahun Berjalan account or push virtual account
        $currentEarningsCoa = $equity->first(fn ($coa) => $coa->kode_akun === '03.2000.03.01' || str_contains(strtolower($coa->nama_akun), 'laba rugi tahun berjalan'));

        if ($currentEarningsCoa) {
            $currentEarningsCoa->saldo = $currentEarnings;
            $currentEarningsCoa->saldo_last_year = $currentEarningsLastYear;
        } else {
            $equity->push((object) [
                'id' => 99999,
                'kode_akun' => '03.9999.99.99',
                'nama_akun' => 'Laba (Rugi) Tahun Berjalan',
                'kategori' => 'ekuitas',
                'saldo' => $currentEarnings,
                'saldo_last_year' => $currentEarningsLastYear,
            ]);
        }

        $totalAssets = $assets->sum('saldo');
        $totalAssetsLastYear = $assets->sum('saldo_last_year');

        $totalLiabilities = $liabilities->sum('saldo');
        $totalLiabilitiesLastYear = $liabilities->sum('saldo_last_year');

        $totalEquity = $equity->sum('saldo');
        $totalEquityLastYear = $equity->sum('saldo_last_year');

        return Inertia::render('reports/balance-sheet', [
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'totalAssets' => $totalAssets,
            'totalAssetsLastYear' => $totalAssetsLastYear,
            'totalLiabilities' => $totalLiabilities,
            'totalLiabilitiesLastYear' => $totalLiabilitiesLastYear,
            'totalEquity' => $totalEquity,
            'totalEquityLastYear' => $totalEquityLastYear,
            'totalLiabilitiesAndEquity' => $totalLiabilities + $totalEquity,
            'totalLiabilitiesAndEquityLastYear' => $totalLiabilitiesLastYear + $totalEquityLastYear,
            'hasAppliedFilter' => true,
            'filters' => [
                'year' => (string) $year,
                'end_date' => $endDate,
            ],
        ]);
    }
}
