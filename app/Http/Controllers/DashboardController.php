<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Menyusun ringkasan aset dan keuangan untuk halaman dasbor pengguna.
 */
class DashboardController extends Controller
{
    /**
     * Menampilkan metrik utama, tren bulanan, jurnal terbaru, dan rincian aset.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = auth()->user();

        // 1. Ringkasan nilai perolehan, penyusutan, dan nilai buku aset.
        $assets = $user->assets()->get();
        $totalAssetAcquisitionCost = $assets->sum('harga_perolehan');
        $totalAccumulatedDepreciation = $assets->sum('akumulasi_penyusutan');
        $totalNetBookValue = $assets->sum('nilai_buku');
        $totalAssetCount = $assets->count();

        // 2. Saldo kas dan setara kas dihitung berdasarkan saldo normal debit.
        $cashCoaIds = $user->coas()
            ->where('kategori', 'aset')
            ->where(function ($query) {
                $query->where('kode_akun', 'like', '01.1000%')
                    ->orWhere('nama_akun', 'like', '%kas%')
                    ->orWhere('nama_akun', 'like', '%bank%');
            })
            ->pluck('id');

        $cashSums = DB::table('journal_items')
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->where('journals.user_id', $user->id)
            ->whereIn('journal_items.coa_id', $cashCoaIds)
            ->selectRaw('COALESCE(SUM(journal_items.debit - journal_items.kredit), 0) as balance')
            ->first();

        $totalCashAndBank = round((float) ($cashSums->balance ?? 0), 2);

        // 3. Laba atau rugi bulan berjalan berasal dari pendapatan dikurangi beban.
        $startOfMonth = now()->startOfMonth()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();

        $incomeCoaIds = $user->coas()->where('kategori', 'pendapatan')->pluck('id');
        $expenseCoaIds = $user->coas()->where('kategori', 'beban')->pluck('id');

        $monthlyIncome = DB::table('journal_items')
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->where('journals.user_id', $user->id)
            ->whereBetween('journals.tanggal', [$startOfMonth, $endOfMonth])
            ->whereIn('journal_items.coa_id', $incomeCoaIds)
            ->selectRaw('COALESCE(SUM(journal_items.kredit - journal_items.debit), 0) as total')
            ->value('total') ?? 0;

        $monthlyExpense = DB::table('journal_items')
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->where('journals.user_id', $user->id)
            ->whereBetween('journals.tanggal', [$startOfMonth, $endOfMonth])
            ->whereIn('journal_items.coa_id', $expenseCoaIds)
            ->selectRaw('COALESCE(SUM(journal_items.debit - journal_items.kredit), 0) as total')
            ->value('total') ?? 0;

        $monthlyNetProfit = round((float) $monthlyIncome - (float) $monthlyExpense, 2);

        // 4. Tren pendapatan dan beban selama enam bulan, termasuk bulan berjalan.
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth()->toDateString();
            $monthEnd = $date->copy()->endOfMonth()->toDateString();
            $monthLabel = $date->translatedFormat('M Y');

            $inc = DB::table('journal_items')
                ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                ->where('journals.user_id', $user->id)
                ->whereBetween('journals.tanggal', [$monthStart, $monthEnd])
                ->whereIn('journal_items.coa_id', $incomeCoaIds)
                ->selectRaw('COALESCE(SUM(journal_items.kredit - journal_items.debit), 0) as total')
                ->value('total') ?? 0;

            $exp = DB::table('journal_items')
                ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                ->where('journals.user_id', $user->id)
                ->whereBetween('journals.tanggal', [$monthStart, $monthEnd])
                ->whereIn('journal_items.coa_id', $expenseCoaIds)
                ->selectRaw('COALESCE(SUM(journal_items.debit - journal_items.kredit), 0) as total')
                ->value('total') ?? 0;

            $monthlyTrend[] = [
                'month' => $monthLabel,
                'income' => round((float) $inc, 2),
                'expense' => round((float) $exp, 2),
                'profit' => round((float) $inc - (float) $exp, 2),
            ];
        }

        // 5. Lima jurnal terbaru beserta jumlah baris dan total debitnya.
        $recentJournals = $user->journals()
            ->with(['items.coa'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc')
            ->take(5)
            ->get()
            ->map(function ($journal) {
                $totalDebit = $journal->items->sum('debit');

                return [
                    'id' => $journal->id,
                    'tanggal' => $journal->tanggal ? $journal->tanggal->format('Y-m-d') : null,
                    'nomor_jurnal' => $journal->nomor_jurnal,
                    'keterangan' => $journal->keterangan,
                    'tipe_jurnal' => $journal->tipe_jurnal,
                    'total_debit' => round((float) $totalDebit, 2),
                    'items_count' => $journal->items->count(),
                ];
            });

        // 6. Rincian aset berdasarkan jenis untuk kebutuhan visualisasi dasbor.
        $assetBreakdown = $assets->groupBy('jenis')->map(function ($group, $key) {
            return [
                'name' => ucfirst($key ?: 'Lainnya'),
                'count' => $group->count(),
                'total_value' => round((float) $group->sum('harga_perolehan'), 2),
                'net_book_value' => round((float) $group->sum('nilai_buku'), 2),
            ];
        })->values();

        return Inertia::render('dashboard', [
            'metrics' => [
                'total_asset_value' => round((float) $totalNetBookValue, 2),
                'total_asset_cost' => round((float) $totalAssetAcquisitionCost, 2),
                'total_accumulated_depreciation' => round((float) $totalAccumulatedDepreciation, 2),
                'total_asset_count' => $totalAssetCount,
                'total_cash_and_bank' => $totalCashAndBank,
                'monthly_income' => round((float) $monthlyIncome, 2),
                'monthly_expense' => round((float) $monthlyExpense, 2),
                'monthly_net_profit' => $monthlyNetProfit,
            ],
            'monthly_trend' => $monthlyTrend,
            'recent_journals' => $recentJournals,
            'asset_breakdown' => $assetBreakdown,
        ]);
    }
}
