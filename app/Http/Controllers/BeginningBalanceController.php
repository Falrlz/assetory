<?php

namespace App\Http\Controllers;

use App\Models\Journal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BeginningBalanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get transactional COAs (Level 4, i.e., those with 4 segments separated by dots)
        $coas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4)
            ->values();

        // Find the existing opening balance journal
        $openingJournal = $user->journals()
            ->where('jenis_transaksi', 'saldo_awal')
            ->with('items')
            ->first();

        // Map existing balances
        $balances = [];
        if ($openingJournal) {
            foreach ($openingJournal->items as $item) {
                $balances[$item->coa_id] = [
                    'debit' => (float) $item->debit,
                    'kredit' => (float) $item->kredit,
                ];
            }
        }

        // Add existing debit/credit to COAs
        $coas = $coas->map(function ($coa) use ($balances) {
            $coa->debit = $balances[$coa->id]['debit'] ?? 0;
            $coa->kredit = $balances[$coa->id]['kredit'] ?? 0;

            return $coa;
        });

        return Inertia::render('beginning-balances/index', [
            'coas' => $coas,
            'openingDate' => $openingJournal ? $openingJournal->tanggal : date('Y').'-01-01',
        ]);
    }

    /**
     * Store beginning balances in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'balances' => 'required|array',
            'balances.*.coa_id' => 'required|exists:coas,id',
            'balances.*.debit' => 'required|numeric|min:0',
            'balances.*.kredit' => 'required|numeric|min:0',
        ]);

        $lockDate = $user->lock_date;
        if ($lockDate) {
            if (Carbon::parse($validated['tanggal'])->lte($lockDate)) {
                throw ValidationException::withMessages([
                    'tanggal' => 'Tanggal saldo awal tidak boleh kurang dari atau sama dengan tanggal penguncian periode ('.$lockDate->format('Y-m-d').').',
                ]);
            }

            $existing = $user->journals()->where('jenis_transaksi', 'saldo_awal')->first();
            if ($existing && Carbon::parse($existing->tanggal)->lte($lockDate)) {
                throw ValidationException::withMessages([
                    'balances' => 'Saldo awal pada periode terkunci tidak dapat diubah.',
                ]);
            }
        }

        $totalDebit = 0;
        $totalKredit = 0;
        $filteredBalances = [];

        foreach ($validated['balances'] as $item) {
            $debit = (float) $item['debit'];
            $kredit = (float) $item['kredit'];

            if ($debit > 0 || $kredit > 0) {
                // Ensure only one of debit or credit is non-zero
                if ($debit > 0 && $kredit > 0) {
                    throw ValidationException::withMessages([
                        'balances' => "Akun dengan ID {$item['coa_id']} tidak boleh memiliki saldo debit dan kredit sekaligus.",
                    ]);
                }

                $totalDebit += $debit;
                $totalKredit += $kredit;
                $filteredBalances[] = $item;
            }
        }

        // We check if total debit equals total credit (only if there are actual balances)
        if (count($filteredBalances) > 0 && round($totalDebit, 2) !== round($totalKredit, 2)) {
            throw ValidationException::withMessages([
                'balances' => 'Total debit ('.number_format($totalDebit, 2).') harus sama dengan total kredit ('.number_format($totalKredit, 2).'). Selisih sebesar '.number_format(abs($totalDebit - $totalKredit), 2).'.',
            ]);
        }

        DB::transaction(function () use ($user, $validated, $filteredBalances) {
            // Delete existing opening balance journal
            $existing = $user->journals()->where('jenis_transaksi', 'saldo_awal')->first();
            if ($existing) {
                $existing->delete(); // This cascades to delete journal_items
            }

            // Create new journal only if there are non-zero balances
            if (count($filteredBalances) > 0) {
                $journal = $user->journals()->create([
                    'tanggal' => $validated['tanggal'],
                    'nomor_jurnal' => 'OP-'.date('Ymd', strtotime($validated['tanggal'])).'-0001',
                    'keterangan' => 'Saldo Awal',
                    'tipe_jurnal' => 'umum',
                    'jenis_transaksi' => 'saldo_awal',
                ]);

                foreach ($filteredBalances as $item) {
                    $journal->items()->create([
                        'coa_id' => $item['coa_id'],
                        'debit' => $item['debit'],
                        'kredit' => $item['kredit'],
                    ]);
                }
            }
        });

        return redirect()->back();
    }
}
