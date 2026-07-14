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

        // 1. Jurnal Umum List (with items, coa & asset)
        $journals = $user->journals()
            ->with(['items.coa', 'asset'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        // 2. COA list for dropdowns & forms
        $coas = $user->coas()
            ->orderBy('kode_akun')
            ->get();

        // 3. Ledger (Buku Besar) query (Odoo style: all accounts in period)
        $startDate = $request->input('start_date', Carbon::now()->startOfYear()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        // Get only transaction COAs (Level 4, matching dotted pattern 'XX.XXXX.XX.XX')
        $transactionCoas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn ($c) => count(explode('.', $c->kode_akun)) === 4)
            ->values();

        $ledgerData = [];
        $grandTotalDebit = 0.00;
        $grandTotalKredit = 0.00;
        $grandTotalSaldo = 0.00;

        foreach ($transactionCoas as $coa) {
            $coaId = $coa->id;
            $saldoNormal = $coa->saldo_normal;

            // Calculate Saldo Awal (before start_date)
            $openingSums = DB::table('journal_items')
                ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                ->where('journals.user_id', $user->id)
                ->where('journal_items.coa_id', $coaId)
                ->where('journals.tanggal', '<', $startDate)
                ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                ->first();

            $debitSumBefore = (float) $openingSums->total_debit;
            $kreditSumBefore = (float) $openingSums->total_kredit;
            if ($saldoNormal === 'debit') {
                $saldoAwal = $debitSumBefore - $kreditSumBefore;
            } else {
                $saldoAwal = $kreditSumBefore - $debitSumBefore;
            }

            // Get journal items for this COA in the date range
            $items = JournalItem::where('coa_id', $coaId)
                ->whereHas('journal', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                ->whereBetween('journals.tanggal', [$startDate, $endDate])
                ->select('journal_items.*', 'journals.tanggal', 'journals.nomor_jurnal', 'journals.keterangan')
                ->orderBy('journals.tanggal', 'asc')
                ->orderBy('journals.id', 'asc')
                ->get();

            // Compute running balance starting from Saldo Awal, total debit, total credit
            $balance = $saldoAwal;
            $totalDebit = 0.00;
            $totalKredit = 0.00;

            $mappedItems = $items->map(function ($item) use (&$balance, $saldoNormal, &$totalDebit, &$totalKredit) {
                $debit = (float) $item->debit;
                $kredit = (float) $item->kredit;
                $totalDebit += $debit;
                $totalKredit += $kredit;

                if ($saldoNormal === 'debit') {
                    $balance += ($debit - $kredit);
                } else {
                    $balance += ($kredit - $debit);
                }

                $item->saldo_berjalan = round($balance, 2);

                return $item;
            });

            $saldoAkhir = $balance;

            // Only list accounts with either non-zero opening balance or active transactions (Odoo style)
            if ($saldoAwal != 0 || $mappedItems->count() > 0) {
                $ledgerData[] = [
                    'coa' => $coa,
                    'saldo_awal' => $saldoAwal,
                    'saldo_akhir' => $saldoAkhir,
                    'total_debit' => $totalDebit,
                    'total_kredit' => $totalKredit,
                    'items' => $mappedItems,
                ];

                $grandTotalDebit += $totalDebit;
                $grandTotalKredit += $totalKredit;
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
            'ledgerData' => $ledgerData,
            'grandTotalDebit' => $grandTotalDebit,
            'grandTotalKredit' => $grandTotalKredit,
            'ledgerFilters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
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
            'jenis_transaksi' => 'required|string|in:jurnal_umum,kas_masuk,kas_keluar,bank_masuk,bank_keluar,jurnal_koreksi',
            'kategori_arus_kas' => 'required|string|in:operasional,investasi,pendanaan',
            'kode_arus_kas' => 'required|string|max:50',
            'keterangan' => 'required|string|max:1000',
            'items' => 'required|array|min:2',
            'items.*.coa_id' => 'required|exists:coas,id',
            'items.*.debit' => 'required|numeric|min:0',
            'items.*.kredit' => 'required|numeric|min:0',
        ]);

        // Authorization and balance checks
        $totalDebit = 0.00;
        $totalKredit = 0.00;

        foreach ($validated['items'] as $index => $item) {
            // Verify COA belongs to user
            $coa = $user->coas()->find($item['coa_id']);
            if (! $coa) {
                throw ValidationException::withMessages([
                    "items.{$index}.coa_id" => 'Akun COA tidak valid atau tidak dimiliki oleh pengguna.',
                ]);
            }

            $debit = (float) $item['debit'];
            $kredit = (float) $item['kredit'];

            if ($debit > 0 && $kredit > 0) {
                throw ValidationException::withMessages([
                    "items.{$index}.debit" => 'Satu baris jurnal tidak boleh berisi Debit dan Kredit sekaligus.',
                    "items.{$index}.kredit" => 'Satu baris jurnal tidak boleh berisi Debit dan Kredit sekaligus.',
                ]);
            }

            if ($debit <= 0 && $kredit <= 0) {
                throw ValidationException::withMessages([
                    "items.{$index}.debit" => 'Harus mengisi salah satu dari Debit atau Kredit.',
                    "items.{$index}.kredit" => 'Harus mengisi salah satu dari Debit atau Kredit.',
                ]);
            }

            $totalDebit += $debit;
            $totalKredit += $kredit;
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

        $prefix = match ($validated['jenis_transaksi']) {
            'jurnal_umum' => 'JU',
            'kas_masuk' => 'KM',
            'kas_keluar' => 'KK',
            'bank_masuk' => 'BM',
            'bank_keluar' => 'BK',
            'jurnal_koreksi' => 'JK',
            default => 'JU',
        };

        DB::transaction(function () use ($user, $validated, $prefix) {
            $journal = $user->journals()->create([
                'tanggal' => $validated['tanggal'],
                'nomor_jurnal' => Journal::generateNumber($user, $prefix),
                'keterangan' => $validated['keterangan'],
                'tipe_jurnal' => 'umum',
                'jenis_transaksi' => $validated['jenis_transaksi'],
                'kategori_arus_kas' => $validated['kategori_arus_kas'],
                'kode_arus_kas' => $validated['kode_arus_kas'],
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

        DB::transaction(function () use ($user, $depreciatedAssets, $targetDate, $bulan) {
            foreach ($depreciatedAssets as $asset) {
                // Find Expense COA dynamically (name pattern match first, then code fallback)
                $bebanCoa = $user->coas()
                    ->where('nama_akun', 'like', 'Beban Penyusutan%')
                    ->where('nama_akun', 'like', '%'.$asset->jenis.'%')
                    ->first();

                if (! $bebanCoa) {
                    $suffixMap = ['gedung' => '01', 'kendaraan' => '02', 'inventaris' => '03'];
                    $suffix = $suffixMap[$asset->jenis] ?? '';
                    $bebanCoa = $user->coas()
                        ->where('kode_akun', '05.2000.03.'.$suffix)
                        ->first();
                }

                // Find Accumulation COA dynamically (name pattern match first, then code fallback)
                $akmCoa = $user->coas()
                    ->where('nama_akun', 'like', 'Akumulasi%')
                    ->where('nama_akun', 'like', '%'.$asset->jenis.'%')
                    ->first();

                if (! $akmCoa) {
                    $suffixMap = ['gedung' => '01', 'kendaraan' => '02', 'inventaris' => '03'];
                    $suffix = $suffixMap[$asset->jenis] ?? '';
                    $akmCoa = $user->coas()
                        ->where('kode_akun', '01.3000.02.'.$suffix)
                        ->first();
                }

                if (! $bebanCoa || ! $akmCoa) {
                    throw new \Exception("Akun COA penyusutan untuk jenis aset '{$asset->jenis}' tidak ditemukan. Mohon pastikan akun beban dan akumulasi penyusutan tersedia di COA.");
                }

                $journal = $user->journals()->create([
                    'tanggal' => $targetDate->format('Y-m-d'),
                    'nomor_jurnal' => Journal::generateNumber($user, 'DP-A'),
                    'keterangan' => "Penyusutan bulanan aset tetap: {$asset->nama} - Periode {$bulan}",
                    'tipe_jurnal' => 'penyusutan',
                    'jenis_transaksi' => null,
                    'kategori_arus_kas' => null,
                    'kode_arus_kas' => null,
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
