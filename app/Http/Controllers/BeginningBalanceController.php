<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Menangani penayangan dan penyimpanan saldo awal akun pengguna.
 */
class BeginningBalanceController extends Controller
{
    /**
     * Menampilkan akun transaksi beserta saldo awal dan status pengunciannya.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Hanya akun level 4 yang dapat menerima transaksi dan saldo awal.
        $coas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4)
            ->values();

        // Satu pengguna hanya memiliki satu jurnal saldo awal yang aktif.
        $openingJournal = $user->journals()
            ->where('jenis_transaksi', 'saldo_awal')
            ->with('items')
            ->first();

        // Indeks berdasarkan ID akun memudahkan saldo dipasangkan kembali ke daftar COA.
        $balances = [];
        if ($openingJournal) {
            foreach ($openingJournal->items as $item) {
                $balances[$item->coa_id] = [
                    'debit' => (float) $item->debit,
                    'kredit' => (float) $item->kredit,
                ];
            }
        }

        // Tambahkan nilai debit dan kredit agar formulir dapat menampilkan data tersimpan.
        $coas = $coas->map(function ($coa) use ($balances) {
            $coa->debit = $balances[$coa->id]['debit'] ?? 0;
            $coa->kredit = $balances[$coa->id]['kredit'] ?? 0;

            return $coa;
        });

        // Saldo awal tidak boleh diubah setelah disimpan atau setelah transaksi lain tercatat.
        $hasActiveTransactions = $user->journals()
            ->where('jenis_transaksi', '!=', 'saldo_awal')
            ->exists();

        $isSaved = $openingJournal !== null;
        $isLocked = $isSaved || $hasActiveTransactions;

        $lockReason = '';
        if ($isSaved) {
            $lockReason = 'Saldo awal telah disimpan dan dikunci.';
        } elseif ($hasActiveTransactions) {
            $lockReason = 'Saldo awal dikunci karena telah terdapat transaksi jurnal aktif.';
        }

        return Inertia::render('beginning-balances/index', [
            'coas' => $coas,
            'openingDate' => $openingJournal ? $openingJournal->tanggal->toDateString() : date('Y').'-01-01',
            'isLocked' => $isLocked,
            'lockReason' => $lockReason,
        ]);
    }

    /**
     * Memvalidasi keseimbangan debit-kredit lalu menyimpan jurnal saldo awal.
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
                // Satu akun hanya boleh memiliki saldo pada salah satu sisi.
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

        // Jurnal saldo awal harus seimbang apabila terdapat nilai yang akan disimpan.
        if (count($filteredBalances) > 0 && round($totalDebit, 2) !== round($totalKredit, 2)) {
            throw ValidationException::withMessages([
                'balances' => 'Total debit ('.number_format($totalDebit, 2).') harus sama dengan total kredit ('.number_format($totalKredit, 2).'). Selisih sebesar '.number_format(abs($totalDebit - $totalKredit), 2).'.',
            ]);
        }

        DB::transaction(function () use ($user, $validated, $filteredBalances) {
            // Ganti jurnal lama secara atomik agar tidak ada dua jurnal saldo awal.
            $existing = $user->journals()->where('jenis_transaksi', 'saldo_awal')->first();
            if ($existing) {
                $existing->delete(); // Item jurnal ikut terhapus melalui aturan cascade.
            }

            // Jangan membuat jurnal kosong jika seluruh saldo bernilai nol.
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
