<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TrialBalanceController extends Controller
{
    /**
     * Display the Trial Balance (Neraca Saldo).
     */
    public function trialBalance(Request $request): Response
    {
        $user = $request->user();

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = $request->input('start_date', Carbon::now()->startOfYear()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        if (Carbon::parse($startDate)->year !== Carbon::parse($endDate)->year) {
            throw ValidationException::withMessages([
                'start_date' => 'Rentang tanggal tidak boleh melewati dua tahun yang berbeda.',
            ]);
        }

        // Get transactional COAs (Level 4, i.e. 4 segments separated by dots)
        $coas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4)
            ->values()
            ->map(function ($coa) use ($user, $startDate, $endDate) {
                // 1. Saldo Awal (before start_date or is setup beginning balance)
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

                // 2. Mutasi (between start_date and end_date, excluding setup beginning balance)
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

                // 3. Saldo Akhir (up to end_date)
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

        // Calculate totals
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
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
