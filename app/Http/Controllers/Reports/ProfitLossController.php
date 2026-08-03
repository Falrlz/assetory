<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfitLossController extends Controller
{
    /**
     * Display the Profit & Loss statement (Laba Rugi).
     */
    public function profitLoss(Request $request): Response
    {
        $user = $request->user();

        $request->validate([
            'year' => 'nullable|numeric|digits:4',
        ]);

        $yearInput = $request->input('year');

        // If no year filter parameters are sent, return initial empty state (Lazy Loading)
        if (! $yearInput) {
            return Inertia::render('reports/profit-loss', [
                'revenues' => [],
                'expenses' => [],
                'totalRevenues' => 0,
                'totalRevenuesLastYear' => 0,
                'totalExpenses' => 0,
                'totalExpensesLastYear' => 0,
                'netProfit' => 0,
                'netProfitLastYear' => 0,
                'hasAppliedFilter' => false,
                'filters' => [
                    'year' => '',
                ],
            ]);
        }

        $year = (int) $yearInput;
        $startDate = "{$year}-01-01";
        $endDate = "{$year}-12-31";

        $prevYear = $year - 1;
        $prevStartDate = "{$prevYear}-01-01";
        $prevEndDate = "{$prevYear}-12-31";

        // Get accounts
        $allCoas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->map(function ($coa) use ($user, $startDate, $endDate, $prevStartDate, $prevEndDate) {
                // Current Year
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

                // Last Year
                $prevSums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->whereBetween('journals.tanggal', [$prevStartDate, $prevEndDate])
                    ->where(function ($query) {
                        $query->whereNotIn('journals.jenis_transaksi', ['saldo_awal', 'jurnal_penutup'])
                            ->orWhereNull('journals.jenis_transaksi');
                    })
                    ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                    ->first();

                $coa->total_debit = (float) $sums->total_debit;
                $coa->total_kredit = (float) $sums->total_kredit;

                $coa->total_debit_last_year = (float) $prevSums->total_debit;
                $coa->total_kredit_last_year = (float) $prevSums->total_kredit;

                // Net balance
                if ($coa->saldo_normal === 'debit') {
                    $coa->saldo = $coa->total_debit - $coa->total_kredit;
                    $coa->saldo_last_year = $coa->total_debit_last_year - $coa->total_kredit_last_year;
                } else {
                    $coa->saldo = $coa->total_kredit - $coa->total_debit;
                    $coa->saldo_last_year = $coa->total_kredit_last_year - $coa->total_debit_last_year;
                }

                return $coa;
            });

        // Filter Revenues (Prefix 04) and Expenses (Prefix 05)
        $revenues = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '04.') || $coa->kategori === 'pendapatan') && count(explode('.', $coa->kode_akun)) === 4)->values();
        $expenses = $allCoas->filter(fn ($coa) => (str_starts_with($coa->kode_akun, '05.') || $coa->kategori === 'beban') && count(explode('.', $coa->kode_akun)) === 4)->values();

        $totalRevenues = $revenues->sum('saldo');
        $totalRevenuesLastYear = $revenues->sum('saldo_last_year');

        $totalExpenses = $expenses->sum('saldo');
        $totalExpensesLastYear = $expenses->sum('saldo_last_year');

        $netProfit = $totalRevenues - $totalExpenses;
        $netProfitLastYear = $totalRevenuesLastYear - $totalExpensesLastYear;

        return Inertia::render('reports/profit-loss', [
            'revenues' => $revenues,
            'expenses' => $expenses,
            'totalRevenues' => $totalRevenues,
            'totalRevenuesLastYear' => $totalRevenuesLastYear,
            'totalExpenses' => $totalExpenses,
            'totalExpensesLastYear' => $totalExpensesLastYear,
            'netProfit' => $netProfit,
            'netProfitLastYear' => $netProfitLastYear,
            'hasAppliedFilter' => true,
            'filters' => [
                'year' => (string) $year,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
