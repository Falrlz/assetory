<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
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

    /**
     * Display the Balance Sheet (Neraca Keuangan).
     */
    public function balanceSheet(Request $request): Response
    {
        $user = $request->user();
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $startDate = Carbon::parse($endDate)->startOfYear()->toDateString(); // For cumulative calculation up to end_date

        // Get all accounts
        $allCoas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->map(function ($coa) use ($user, $endDate) {
                $sums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->where('journals.tanggal', '<=', $endDate) // Cumulative since beginning
                    ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                    ->first();

                $coa->total_debit = (float) $sums->total_debit;
                $coa->total_kredit = (float) $sums->total_kredit;

                // Net balance
                if ($coa->saldo_normal === 'debit') {
                    $coa->saldo = $coa->total_debit - $coa->total_kredit;
                } else {
                    $coa->saldo = $coa->total_kredit - $coa->total_debit;
                }

                return $coa;
            });

        // Filter and group by category
        $assets = $allCoas->filter(fn ($coa) => $coa->kategori === 'aset' && count(explode('.', $coa->kode_akun)) === 4)->values();
        $liabilities = $allCoas->filter(fn ($coa) => $coa->kategori === 'kewajiban' && count(explode('.', $coa->kode_akun)) === 4)->values();
        $equity = $allCoas->filter(fn ($coa) => $coa->kategori === 'ekuitas' && count(explode('.', $coa->kode_akun)) === 4)->values();

        // Calculate Net Income (Laba Rugi Tahun Berjalan) to add to Equity automatically
        $revenues = $allCoas->filter(fn ($coa) => $coa->kategori === 'pendapatan' && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo');
        $expenses = $allCoas->filter(fn ($coa) => $coa->kategori === 'beban' && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo');
        $currentEarnings = $revenues - $expenses;

        // Add current earnings to Equity list
        $equity->push((object) [
            'id' => 99999,
            'kode_akun' => '3.9999.99.99',
            'nama_akun' => 'Laba (Rugi) Tahun Berjalan',
            'kategori' => 'ekuitas',
            'saldo' => $currentEarnings,
        ]);

        $totalAssets = $assets->sum('saldo');
        $totalLiabilities = $liabilities->sum('saldo');
        $totalEquity = $equity->sum('saldo');

        return Inertia::render('reports/balance-sheet', [
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'totalAssets' => $totalAssets,
            'totalLiabilities' => $totalLiabilities,
            'totalEquity' => $totalEquity,
            'totalLiabilitiesAndEquity' => $totalLiabilities + $totalEquity,
            'filters' => [
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Display the Profit & Loss statement (Laba Rugi).
     */
    public function profitLoss(Request $request): Response
    {
        $user = $request->user();

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        if (Carbon::parse($startDate)->year !== Carbon::parse($endDate)->year) {
            throw ValidationException::withMessages([
                'start_date' => 'Rentang tanggal tidak boleh melewati dua tahun yang berbeda.',
            ]);
        }

        // Get accounts
        $allCoas = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->map(function ($coa) use ($user, $startDate, $endDate) {
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

                $coa->total_debit = (float) $sums->total_debit;
                $coa->total_kredit = (float) $sums->total_kredit;

                // Net balance
                if ($coa->saldo_normal === 'debit') {
                    $coa->saldo = $coa->total_debit - $coa->total_kredit;
                } else {
                    $coa->saldo = $coa->total_kredit - $coa->total_debit;
                }

                return $coa;
            });

        $revenues = $allCoas->filter(fn ($coa) => $coa->kategori === 'pendapatan' && count(explode('.', $coa->kode_akun)) === 4)->values();
        $expenses = $allCoas->filter(fn ($coa) => $coa->kategori === 'beban' && count(explode('.', $coa->kode_akun)) === 4)->values();

        $totalRevenues = $revenues->sum('saldo');
        $totalExpenses = $expenses->sum('saldo');
        $netProfit = $totalRevenues - $totalExpenses;

        return Inertia::render('reports/profit-loss', [
            'revenues' => $revenues,
            'expenses' => $expenses,
            'totalRevenues' => $totalRevenues,
            'totalExpenses' => $totalExpenses,
            'netProfit' => $netProfit,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Display the Cash Flow statement (Laporan Arus Kas).
     */
    public function cashFlow(Request $request): Response
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

        // Retrieve cash flow items matching cash accounts (excluding setup beginning balance)
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
                // Match cash and bank accounts (kategori aset, and either starts with 01.1 / 1-1, or has Kas/Bank in name)
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

        // Group by cash flow categories
        $operating = $cashItems->filter(fn ($item) => $item->kategori_arus_kas === 'operasional');
        $investing = $cashItems->filter(fn ($item) => $item->kategori_arus_kas === 'investasi');
        $financing = $cashItems->filter(fn ($item) => $item->kategori_arus_kas === 'pendanaan');

        $totalOperating = $operating->sum('cash_in') - $operating->sum('cash_out');
        $totalInvesting = $investing->sum('cash_in') - $investing->sum('cash_out');
        $totalFinancing = $financing->sum('cash_in') - $financing->sum('cash_out');

        // Net change in cash
        $netChange = $totalOperating + $totalInvesting + $totalFinancing;

        // Calculate beginning cash (transactions before start_date or setup beginning balance)
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

        $endingCash = $beginningCash + $netChange;

        return Inertia::render('reports/cash-flow', [
            'operatingItems' => $operating->values(),
            'investingItems' => $investing->values(),
            'financingItems' => $financing->values(),
            'totalOperating' => $totalOperating,
            'totalInvesting' => $totalInvesting,
            'totalFinancing' => $totalFinancing,
            'beginningCash' => (float) $beginningCash,
            'endingCash' => (float) $endingCash,
            'netChange' => $netChange,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Display the Statement of Changes in Equity (Laporan Perubahan Ekuitas).
     */
    public function equityChange(Request $request): Response
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

        // Get equity accounts (Level 4, i.e. 4 segments separated by dots)
        $equityCoas = $user->coas()
            ->where('kategori', 'ekuitas')
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4)
            ->values();

        $equityData = [];
        $totalAwal = 0;
        $totalTambahan = 0;
        $totalLabaNet = 0;
        $totalAkhir = 0;

        // 1. Calculate Net Profit for current period
        $allCoasForPL = $user->coas()
            ->orderBy('kode_akun')
            ->get()
            ->map(function ($coa) use ($user, $startDate, $endDate) {
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

                $coa->total_debit = (float) $sums->total_debit;
                $coa->total_kredit = (float) $sums->total_kredit;

                if ($coa->saldo_normal === 'debit') {
                    $coa->saldo = $coa->total_debit - $coa->total_kredit;
                } else {
                    $coa->saldo = $coa->total_kredit - $coa->total_debit;
                }

                return $coa;
            });

        $totalRevenues = $allCoasForPL->filter(fn ($coa) => $coa->kategori === 'pendapatan' && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo');
        $totalExpenses = $allCoasForPL->filter(fn ($coa) => $coa->kategori === 'beban' && count(explode('.', $coa->kode_akun)) === 4)->sum('saldo');
        $netProfit = $totalRevenues - $totalExpenses;

        // Process each equity account
        foreach ($equityCoas as $coa) {
            // A. Opening balance (before start_date OR is setup beginning balance)
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

            $balAwal = (float) $openingSums->total_kredit - (float) $openingSums->total_debit;

            // B. Additions (Modal Tambahan / changes during period, excluding setup beginning balance)
            // Exclude Saldo Laba (03.2000.02.01) and Laba Rugi Tahun Berjalan (03.2000.03.01) from manual additions
            $balTambahan = 0.00;
            if ($coa->kode_akun !== '03.2000.02.01' && $coa->kode_akun !== '03.2000.03.01') {
                $periodSums = DB::table('journal_items')
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
                $balTambahan = (float) $periodSums->total_kredit - (float) $periodSums->total_debit;
            }

            // C. Net Profit Addition (Specifically for Laba Rugi Tahun Berjalan account)
            $labaNet = 0.00;
            if ($coa->kode_akun === '03.2000.03.01') {
                $labaNet = $netProfit;
            }

            $balAkhir = $balAwal + $balTambahan + $labaNet;

            if ($balAwal != 0 || $balTambahan != 0 || $labaNet != 0 || $balAkhir != 0) {
                $equityData[] = [
                    'kode_akun' => $coa->kode_akun,
                    'nama_akun' => $coa->nama_akun,
                    'saldo_awal' => $balAwal,
                    'tambahan' => $balTambahan,
                    'laba_net' => $labaNet,
                    'saldo_akhir' => $balAkhir,
                ];

                $totalAwal += $balAwal;
                $totalTambahan += $balTambahan;
                $totalLabaNet += $labaNet;
                $totalAkhir += $balAkhir;
            }
        }

        return Inertia::render('reports/equity-change', [
            'equityItems' => $equityData,
            'totalAwal' => $totalAwal,
            'totalTambahan' => $totalTambahan,
            'totalLabaNet' => $totalLabaNet,
            'totalAkhir' => $totalAkhir,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Display the Notes to Financial Statements (Catatan Atas Laporan Keuangan - CALK).
     */
    public function calk(Request $request): Response
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

        // 1. Get detailed Assets Schedule
        $assets = $user->assets()
            ->where('tanggal_perolehan', '<=', $endDate)
            ->get()
            ->map(function ($asset) use ($endDate) {
                $masaPenggunaanBulan = 0;
                $perolehan = Carbon::parse($asset->tanggal_perolehan)->startOfMonth();
                $target = Carbon::parse($endDate)->endOfMonth();

                if ($target->isAfter($perolehan) || $target->isSameDay($perolehan->endOfMonth())) {
                    $masaPenggunaanBulan = $perolehan->diffInMonths($target->startOfMonth()) + 1;
                }

                $maxMonths = (Asset::PERIODE_TAHUN[$asset->periode] ?? 4) * 12;
                $masaPenggunaanBulan = min($masaPenggunaanBulan, $maxMonths);

                $akmPenyusutan = $asset->penyusutan_bulanan * $masaPenggunaanBulan;
                $nilaiBuku = max($asset->harga_perolehan - $akmPenyusutan, $asset->nilai_residu);

                $asset->akumulasi_penyusutan = $akmPenyusutan;
                $asset->nilai_buku = $nilaiBuku;
                $asset->sisa_bulan = max($maxMonths - $masaPenggunaanBulan, 0);

                return $asset;
            });

        // 2. Get Cash and Bank details (Breakdown of Kas & Setara Kas)
        $cashCoas = $user->coas()
            ->where('kategori', 'aset')
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4)
            ->filter(function ($coa) {
                return str_starts_with($coa->kode_akun, '01.1') ||
                       str_starts_with($coa->kode_akun, '1-1') ||
                       stripos($coa->nama_akun, 'Kas') !== false ||
                       stripos($coa->nama_akun, 'Bank') !== false;
            })
            ->map(function ($coa) use ($user, $endDate) {
                $sums = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.user_id', $user->id)
                    ->where('journal_items.coa_id', $coa->id)
                    ->where('journals.tanggal', '<=', $endDate)
                    ->selectRaw('COALESCE(SUM(journal_items.debit - journal_items.kredit), 0) as balance')
                    ->first();
                $coa->saldo = (float) $sums->balance;

                return $coa;
            })
            ->filter(fn ($coa) => $coa->saldo != 0)
            ->values();

        return Inertia::render('reports/calk', [
            'assets' => $assets,
            'cashItems' => $cashCoas,
            'calkNotes' => $user->calk_notes,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Update the CALK narrative notes.
     */
    public function updateCalk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'calk_notes' => 'nullable|string|max:50000',
        ]);

        $request->user()->update([
            'calk_notes' => $validated['calk_notes'],
        ]);

        return redirect()->back();
    }
}

// Helpers outside the class (as local private utilities or file helper)
function netNegativeAsDebit($net)
{
    return $net < 0;
}
function netNegativeAsKredit($net)
{
    return $net < 0;
}
