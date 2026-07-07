<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Coa;
use App\Models\Journal;
use App\Models\JournalItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JournalController extends Controller
{
    /**
     * Display a listing of journals, ledger, and depreciation postings.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. Jurnal Umum List (with items & coa)
        $journals = $user->journals()
            ->with(['items.coa'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        // 2. COA list for dropdowns & forms
        $coas = $user->coas()
            ->orderBy('kode_akun')
            ->get();

        // 3. Ledger (Buku Besar) query if coa_id is selected
        $ledgerCoa = null;
        $ledgerItems = [];
        $saldoAwal = 0.00;
        $saldoNormal = 'debit';

        if ($request->has('coa_id')) {
            $coaId = $request->input('coa_id');
            $ledgerCoa = $user->coas()->find($coaId);

            if ($ledgerCoa) {
                $saldoNormal = $ledgerCoa->saldo_normal;

                // Get all journal items for this COA ordered by date
                $items = JournalItem::where('coa_id', $coaId)
                    ->whereHas('journal', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->select('journal_items.*', 'journals.tanggal', 'journals.nomor_jurnal', 'journals.keterangan')
                    ->orderBy('journals.tanggal', 'asc')
                    ->orderBy('journals.id', 'asc')
                    ->get();

                // Compute running balance
                $balance = 0.00;
                $ledgerItems = $items->map(function ($item) use (&$balance, $saldoNormal) {
                    $debit = (float) $item->debit;
                    $kredit = (float) $item->kredit;

                    if ($saldoNormal === 'debit') {
                        $balance += ($debit - $kredit);
                    } else {
                        $balance += ($kredit - $debit);
                    }

                    $item->saldo_berjalan = round($balance, 2);

                    return $item;
                });
            }
        }

        // 4. Monthly Depreciation Posting state
        $postedMonths = $user->journals()
            ->where('tipe_jurnal', 'penyusutan')
            ->pluck('tanggal')
            ->map(function ($date) {
                return Carbon::parse($date)->format('Y-m');
            })
            ->unique()
            ->values()
            ->all();

        $assets = $user->assets()->latest()->get();

        return Inertia::render('journals/index', [
            'journals' => $journals,
            'coas' => $coas,
            'ledgerCoa' => $ledgerCoa,
            'ledgerItems' => $ledgerItems,
            'postedMonths' => $postedMonths,
            'assets' => $assets,
        ]);
    }

    /**
     * Store a newly created manual journal.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'keterangan' => 'required|string|max:1000',
            'items' => 'required|array|min:2',
            'items.*.coa_id' => 'required|exists:coas,id',
            'items.*.debit' => 'required|numeric|min:0',
            'items.*.kredit' => 'required|numeric|min:0',
        ]);

        // Authorization and balance checks
        $totalDebit = 0.00;
        $totalKredit = 0.00;

        foreach ($validated['items'] as $item) {
            // Verify COA belongs to user
            $coa = $user->coas()->find($item['coa_id']);
            if (! $coa) {
                throw ValidationException::withMessages([
                    'items' => 'Akun COA tidak valid atau tidak dimiliki oleh pengguna.',
                ]);
            }
            $totalDebit += (float) $item['debit'];
            $totalKredit += (float) $item['kredit'];
        }

        if (round($totalDebit, 2) !== round($totalKredit, 2)) {
            throw ValidationException::withMessages([
                'items' => 'Jumlah Debit ('.number_format($totalDebit, 2).') harus sama dengan jumlah Kredit ('.number_format($totalKredit, 2).').',
            ]);
        }

        if (round($totalDebit, 2) <= 0) {
            throw ValidationException::withMessages([
                'items' => 'Nilai transaksi jurnal harus lebih dari 0.',
            ]);
        }

        DB::transaction(function () use ($user, $validated) {
            $journal = $user->journals()->create([
                'tanggal' => $validated['tanggal'],
                'nomor_jurnal' => Journal::generateNumber($user, 'JV'),
                'keterangan' => $validated['keterangan'],
                'tipe_jurnal' => 'umum',
            ]);

            foreach ($validated['items'] as $item) {
                $journal->items()->create([
                    'coa_id' => $item['coa_id'],
                    'debit' => $item['debit'],
                    'kredit' => $item['kredit'],
                ]);
            }
        });

        return redirect()->back();
    }

    /**
     * Remove the specified journal.
     */
    public function destroy(int $id): RedirectResponse
    {
        $journal = auth()->user()->journals()->findOrFail($id);
        $journal->delete();

        return redirect()->back();
    }

    /**
     * Post monthly depreciation journals for all active assets.
     */
    public function postDepreciation(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'bulan' => 'required|string|regex:/^\d{4}-\d{2}$/',
        ]);

        $bulan = $validated['bulan']; // YYYY-MM
        $targetDate = Carbon::parse($bulan.'-01')->endOfMonth();

        // Check if already posted
        $alreadyPosted = $user->journals()
            ->where('tipe_jurnal', 'penyusutan')
            ->whereYear('tanggal', $targetDate->year)
            ->whereMonth('tanggal', $targetDate->month)
            ->exists();

        if ($alreadyPosted) {
            throw ValidationException::withMessages([
                'bulan' => 'Jurnal penyusutan untuk bulan '.$bulan.' sudah pernah diposting.',
            ]);
        }

        // Get all active assets for that month
        $assets = $user->assets()
            ->where('tanggal_perolehan', '<=', $targetDate)
            ->get();

        $depreciatedAssets = [];

        foreach ($assets as $asset) {
            $perolehan = Carbon::parse($asset->tanggal_perolehan)->startOfMonth();
            $diffInMonths = $perolehan->diffInMonths(Carbon::parse($bulan.'-01'));
            $maxMonths = (Asset::PERIODE_TAHUN[$asset->periode] ?? 4) * 12;

            if ($targetDate->isAfter($perolehan) || $targetDate->isSameDay($perolehan->endOfMonth())) {
                if ($diffInMonths < $maxMonths) {
                    $depreciatedAssets[] = $asset;
                }
            }
        }

        if (empty($depreciatedAssets)) {
            throw ValidationException::withMessages([
                'bulan' => 'Tidak ada aset aktif yang memerlukan penyusutan pada bulan '.$bulan.'.',
            ]);
        }

        // Gather COAs
        // Beban COAs
        $bebanInventaris = $user->coas()->where('kode_akun', '05.2000.03.03')->first();
        $bebanKendaraan = $user->coas()->where('kode_akun', '05.2000.03.02')->first();
        $bebanGedung = $user->coas()->where('kode_akun', '05.2000.03.01')->first();

        // Akumulasi COAs
        $akmInventaris = $user->coas()->where('kode_akun', '01.3000.02.03')->first();
        $akmKendaraan = $user->coas()->where('kode_akun', '01.3000.02.02')->first();
        $akmGedung = $user->coas()->where('kode_akun', '01.3000.02.01')->first();

        DB::transaction(function () use ($user, $depreciatedAssets, $targetDate, $bulan, $bebanInventaris, $bebanKendaraan, $bebanGedung, $akmInventaris, $akmKendaraan, $akmGedung) {
            foreach ($depreciatedAssets as $asset) {
                // Determine COAs based on asset type
                $bebanCoa = match ($asset->jenis) {
                    'inventaris' => $bebanInventaris,
                    'kendaraan' => $bebanKendaraan,
                    'gedung' => $bebanGedung,
                    default => null,
                };

                $akmCoa = match ($asset->jenis) {
                    'inventaris' => $akmInventaris,
                    'kendaraan' => $akmKendaraan,
                    'gedung' => $akmGedung,
                    default => null,
                };

                if (! $bebanCoa || ! $akmCoa) {
                    throw new \Exception("Akun COA penyusutan untuk jenis aset '{$asset->jenis}' tidak ditemukan. Mohon pastikan akun beban dan akumulasi penyusutan tersedia di COA.");
                }

                $journal = $user->journals()->create([
                    'tanggal' => $targetDate->format('Y-m-d'),
                    'nomor_jurnal' => Journal::generateNumber($user, 'DP'),
                    'keterangan' => "Penyusutan bulanan aset tetap: {$asset->nama} - Periode {$bulan}",
                    'tipe_jurnal' => 'penyusutan',
                    'ref_id' => $asset->id,
                ]);

                // Debit: Beban Penyusutan
                $journal->items()->create([
                    'coa_id' => $bebanCoa->id,
                    'debit' => $asset->penyusutan_bulanan,
                    'kredit' => 0.00,
                ]);

                // Kredit: Akumulasi Penyusutan
                $journal->items()->create([
                    'coa_id' => $akmCoa->id,
                    'debit' => 0.00,
                    'kredit' => $asset->penyusutan_bulanan,
                ]);
            }
        });

        return redirect()->back();
    }
}
