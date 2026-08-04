<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Menyusun saldo awal, mutasi, dan saldo akhir setiap akun transaksi.
 */
class TrialBalanceController extends Controller
{
    /**
     * Menampilkan neraca saldo untuk rentang tanggal dalam satu tahun yang sama.
     */
    public function trialBalance(Request $request): Response
    {
        $user = $request->user();

        $request->validate([
            'year' => 'nullable|numeric|digits:4',
        ]);

        $yearInput = $request->input('year');

        if (! $yearInput) {
            return Inertia::render('reports/trial-balance', [
                'coas' => [],
                'totalAwalDebit' => 0,
                'totalAwalKredit' => 0,
                'totalMutasiDebit' => 0,
                'totalMutasiKredit' => 0,
                'totalAkhirDebit' => 0,
                'totalAkhirKredit' => 0,
                'hasAppliedFilter' => false,
                'filters' => [
                    'year' => '',
                ],
            ]);
        }

        $year = (int) $yearInput;
        $startDate = "{$year}-01-01";
        $endDate = "{$year}-12-31";

        // Hanya akun level empat yang dapat menerima pencatatan transaksi.
        $coas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4)
            ->values()
            ->map(function ($coa) use ($user, $startDate, $endDate) {
                // Saldo awal berasal dari transaksi sebelum tanggal mulai atau jurnal saldo awal pada/sebelum tanggal mulai.
                $openingSums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->where(function ($query) use ($startDate) {
                        $query->where('journals.tanggal', '<', $startDate)
                            ->orWhere(function ($q) use ($startDate) {
                                $q->where('journals.jenis_transaksi', 'saldo_awal')
                                    ->where('journals.tanggal', '<=', $startDate);
                            });
                    })
                    ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                    ->first();

                $debitBefore = (float) $openingSums->total_debit;
                $kreditBefore = (float) $openingSums->total_kredit;

                if ($coa->saldo_normal === 'debit') {
                    $netBefore = $debitBefore - $kreditBefore;
                    $coa->saldo_awal_debit = $netBefore >= 0 ? $netBefore : 0;
                    $coa->saldo_awal_kredit = $netBefore < 0 ? abs($netBefore) : 0;
                } else {
                    $netBefore = $kreditBefore - $debitBefore;
                    $coa->saldo_awal_debit = $netBefore < 0 ? abs($netBefore) : 0;
                    $coa->saldo_awal_kredit = $netBefore >= 0 ? $netBefore : 0;
                }

                // Mutasi mencakup transaksi dalam periode, tanpa saldo awal dan jurnal penutup.
                $mutationSums = DB::table('journal_items')
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

                $coa->mutasi_debit = (float) $mutationSums->total_debit;
                $coa->mutasi_kredit = (float) $mutationSums->total_kredit;

                // Saldo akhir merupakan saldo kumulatif sampai tanggal akhir periode.
                $endingSums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->where('journals.tanggal', '<=', $endDate)
                    ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                    ->first();

                $debitEnding = (float) $endingSums->total_debit;
                $kreditEnding = (float) $endingSums->total_kredit;

                if ($coa->saldo_normal === 'debit') {
                    $netEnding = $debitEnding - $kreditEnding;
                    $coa->saldo_akhir_debit = $netEnding >= 0 ? $netEnding : 0;
                    $coa->saldo_akhir_kredit = $netEnding < 0 ? abs($netEnding) : 0;
                } else {
                    $netEnding = $kreditEnding - $debitEnding;
                    $coa->saldo_akhir_debit = $netEnding < 0 ? abs($netEnding) : 0;
                    $coa->saldo_akhir_kredit = $netEnding >= 0 ? $netEnding : 0;
                }

                return $coa;
            });

        // Jumlahkan setiap kolom untuk memeriksa keseimbangan debit dan kredit.
        $totalAwalDebit = $coas->sum('saldo_awal_debit');
        $totalAwalKredit = $coas->sum('saldo_awal_kredit');
        $totalMutasiDebit = $coas->sum('mutasi_debit');
        $totalMutasiKredit = $coas->sum('mutasi_kredit');
        $totalAkhirDebit = $coas->sum('saldo_akhir_debit');
        $totalAkhirKredit = $coas->sum('saldo_akhir_kredit');

        return Inertia::render('reports/trial-balance', [
            'coas' => $coas,
            'totalAwalDebit' => $totalAwalDebit,
            'totalAwalKredit' => $totalAwalKredit,
            'totalMutasiDebit' => $totalMutasiDebit,
            'totalMutasiKredit' => $totalMutasiKredit,
            'totalAkhirDebit' => $totalAkhirDebit,
            'totalAkhirKredit' => $totalAkhirKredit,
            'hasAppliedFilter' => true,
            'filters' => [
                'year' => (string) $year,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
