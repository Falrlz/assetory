<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Menyusun penerimaan dan pengeluaran kas berdasarkan kategori aktivitasnya.
 */
class CashFlowController extends Controller
{
    /**
     * Menampilkan laporan arus kas beserta perbandingan tahun sebelumnya.
     */
    public function cashFlow(Request $request): Response
    {
        $user = $request->user();

        $request->validate([
            'year' => 'nullable|numeric|digits:4',
        ]);

        $yearInput = $request->input('year');

        if (! $yearInput) {
            return Inertia::render('reports/cash-flow', [
                'operatingItems' => [],
                'investingItems' => [],
                'financingItems' => [],
                'totalOperating' => 0,
                'totalOperatingLastYear' => 0,
                'totalOperatingIn' => 0,
                'totalOperatingOut' => 0,
                'totalOperatingInLastYear' => 0,
                'totalOperatingOutLastYear' => 0,
                'totalInvesting' => 0,
                'totalInvestingLastYear' => 0,
                'totalInvestingIn' => 0,
                'totalInvestingOut' => 0,
                'totalInvestingInLastYear' => 0,
                'totalInvestingOutLastYear' => 0,
                'totalFinancing' => 0,
                'totalFinancingLastYear' => 0,
                'totalFinancingIn' => 0,
                'totalFinancingOut' => 0,
                'totalFinancingInLastYear' => 0,
                'totalFinancingOutLastYear' => 0,
                'beginningCash' => 0,
                'beginningCashLastYear' => 0,
                'endingCash' => 0,
                'endingCashLastYear' => 0,
                'netChange' => 0,
                'netChangeLastYear' => 0,
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

        // Ambil transaksi tahun berjalan yang menyentuh akun kas, tanpa jurnal saldo awal.
        $cashItems = DB::table('journal_items')
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->join('coas', 'journal_items.coa_id', '=', 'coas.id')
            ->where('journals.user_id', $user->id)
            ->whereBetween('journals.tanggal', [$startDate, $endDate])
            ->where(function ($query) {
                $query->where('journals.jenis_transaksi', '!=', 'saldo_awal')
                    ->orWhereNull('journals.jenis_transaksi');
            })
            ->where(function ($query) {
                // Kenali akun kas/bank dari kategori, awalan kode, atau nama akun.
                $query->where('coas.kategori', 'aset')
                    ->where(function ($q) {
                        $q->where('coas.kode_akun', 'like', '01.1%')
                            ->orWhere('coas.kode_akun', 'like', '1-1%')
                            ->orWhere('coas.nama_akun', 'like', '%Kas%')
                            ->orWhere('coas.nama_akun', 'like', '%Bank%');
                    });
            })
            ->select(
                'journals.kategori_arus_kas',
                'journals.keterangan',
                'journals.tanggal',
                'journals.nomor_jurnal',
                'journal_items.debit as cash_in',
                'journal_items.kredit as cash_out'
            )
            ->get();

        // Ambil transaksi kas tahun sebelumnya sebagai pembanding.
        $prevCashItems = DB::table('journal_items')
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->join('coas', 'journal_items.coa_id', '=', 'coas.id')
            ->where('journals.user_id', $user->id)
            ->whereBetween('journals.tanggal', [$prevStartDate, $prevEndDate])
            ->where(function ($query) {
                $query->where('journals.jenis_transaksi', '!=', 'saldo_awal')
                    ->orWhereNull('journals.jenis_transaksi');
            })
            ->where(function ($query) {
                $query->where('coas.kategori', 'aset')
                    ->where(function ($q) {
                        $q->where('coas.kode_akun', 'like', '01.1%')
                            ->orWhere('coas.kode_akun', 'like', '1-1%')
                            ->orWhere('coas.nama_akun', 'like', '%Kas%')
                            ->orWhere('coas.nama_akun', 'like', '%Bank%');
                    });
            })
            ->select(
                'journals.kategori_arus_kas',
                'journals.keterangan',
                'journals.tanggal',
                'journals.nomor_jurnal',
                'journal_items.debit as cash_in',
                'journal_items.kredit as cash_out'
            )
            ->get();

        // Kelompokkan transaksi menurut aktivitas operasional, investasi, dan pendanaan.
        $operating = $cashItems->filter(fn ($item) => $item->kategori_arus_kas === 'operasional');
        $investing = $cashItems->filter(fn ($item) => $item->kategori_arus_kas === 'investasi');
        $financing = $cashItems->filter(fn ($item) => $item->kategori_arus_kas === 'pendanaan');

        $totalOperating = $operating->sum('cash_in') - $operating->sum('cash_out');
        $totalInvesting = $investing->sum('cash_in') - $investing->sum('cash_out');
        $totalFinancing = $financing->sum('cash_in') - $financing->sum('cash_out');

        $totalOperatingIn = (float) $operating->sum('cash_in');
        $totalOperatingOut = (float) $operating->sum('cash_out');
        $totalInvestingIn = (float) $investing->sum('cash_in');
        $totalInvestingOut = (float) $investing->sum('cash_out');
        $totalFinancingIn = (float) $financing->sum('cash_in');
        $totalFinancingOut = (float) $financing->sum('cash_out');

        // Terapkan pengelompokan yang sama pada data tahun sebelumnya.
        $prevOperating = $prevCashItems->filter(fn ($item) => $item->kategori_arus_kas === 'operasional');
        $prevInvesting = $prevCashItems->filter(fn ($item) => $item->kategori_arus_kas === 'investasi');
        $prevFinancing = $prevCashItems->filter(fn ($item) => $item->kategori_arus_kas === 'pendanaan');

        $totalOperatingLastYear = $prevOperating->sum('cash_in') - $prevOperating->sum('cash_out');
        $totalInvestingLastYear = $prevInvesting->sum('cash_in') - $prevInvesting->sum('cash_out');
        $totalFinancingLastYear = $prevFinancing->sum('cash_in') - $prevFinancing->sum('cash_out');

        $totalOperatingInLastYear = (float) $prevOperating->sum('cash_in');
        $totalOperatingOutLastYear = (float) $prevOperating->sum('cash_out');
        $totalInvestingInLastYear = (float) $prevInvesting->sum('cash_in');
        $totalInvestingOutLastYear = (float) $prevInvesting->sum('cash_out');
        $totalFinancingInLastYear = (float) $prevFinancing->sum('cash_in');
        $totalFinancingOutLastYear = (float) $prevFinancing->sum('cash_out');

        // Perubahan bersih kas adalah jumlah arus kas dari ketiga aktivitas.
        $netChange = $totalOperating + $totalInvesting + $totalFinancing;
        $netChangeLastYear = $totalOperatingLastYear + $totalInvestingLastYear + $totalFinancingLastYear;

        // Saldo kas awal mencakup transaksi sebelum periode dan jurnal saldo awal.
        $beginningCash = DB::table('journal_items')
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->join('coas', 'journal_items.coa_id', '=', 'coas.id')
            ->where('journals.user_id', $user->id)
            ->where(function ($query) use ($startDate) {
                $query->where('journals.tanggal', '<', $startDate)
                    ->orWhere('journals.jenis_transaksi', 'saldo_awal');
            })
            ->where(function ($query) {
                $query->where('coas.kategori', 'aset')
                    ->where(function ($q) {
                        $q->where('coas.kode_akun', 'like', '01.1%')
                            ->orWhere('coas.kode_akun', 'like', '1-1%')
                            ->orWhere('coas.nama_akun', 'like', '%Kas%')
                            ->orWhere('coas.nama_akun', 'like', '%Bank%');
                    });
            })
            ->selectRaw('COALESCE(SUM(journal_items.debit - journal_items.kredit), 0) as balance')
            ->value('balance');

        // Hitung saldo kas awal untuk periode pembanding.
        $beginningCashLastYear = DB::table('journal_items')
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->join('coas', 'journal_items.coa_id', '=', 'coas.id')
            ->where('journals.user_id', $user->id)
            ->where(function ($query) use ($prevStartDate) {
                $query->where('journals.tanggal', '<', $prevStartDate)
                    ->orWhere('journals.jenis_transaksi', 'saldo_awal');
            })
            ->where(function ($query) {
                $query->where('coas.kategori', 'aset')
                    ->where(function ($q) {
                        $q->where('coas.kode_akun', 'like', '01.1%')
                            ->orWhere('coas.kode_akun', 'like', '1-1%')
                            ->orWhere('coas.nama_akun', 'like', '%Kas%')
                            ->orWhere('coas.nama_akun', 'like', '%Bank%');
                    });
            })
            ->selectRaw('COALESCE(SUM(journal_items.debit - journal_items.kredit), 0) as balance')
            ->value('balance');

        $endingCash = $beginningCash + $netChange;
        $endingCashLastYear = $beginningCashLastYear + $netChangeLastYear;

        return Inertia::render('reports/cash-flow', [
            'operatingItems' => $operating->values(),
            'investingItems' => $investing->values(),
            'financingItems' => $financing->values(),
            'totalOperating' => $totalOperating,
            'totalOperatingLastYear' => $totalOperatingLastYear,
            'totalOperatingIn' => $totalOperatingIn,
            'totalOperatingOut' => $totalOperatingOut,
            'totalOperatingInLastYear' => $totalOperatingInLastYear,
            'totalOperatingOutLastYear' => $totalOperatingOutLastYear,
            'totalInvesting' => $totalInvesting,
            'totalInvestingLastYear' => $totalInvestingLastYear,
            'totalInvestingIn' => $totalInvestingIn,
            'totalInvestingOut' => $totalInvestingOut,
            'totalInvestingInLastYear' => $totalInvestingInLastYear,
            'totalInvestingOutLastYear' => $totalInvestingOutLastYear,
            'totalFinancing' => $totalFinancing,
            'totalFinancingLastYear' => $totalFinancingLastYear,
            'totalFinancingIn' => $totalFinancingIn,
            'totalFinancingOut' => $totalFinancingOut,
            'totalFinancingInLastYear' => $totalFinancingInLastYear,
            'totalFinancingOutLastYear' => $totalFinancingOutLastYear,
            'beginningCash' => (float) $beginningCash,
            'beginningCashLastYear' => (float) $beginningCashLastYear,
            'endingCash' => (float) $endingCash,
            'endingCashLastYear' => (float) $endingCashLastYear,
            'netChange' => $netChange,
            'netChangeLastYear' => $netChangeLastYear,
            'hasAppliedFilter' => true,
            'filters' => [
                'year' => (string) $year,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
