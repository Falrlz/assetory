<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Menyusun rincian pendukung dan catatan naratif laporan keuangan.
 */
class CalkController extends Controller
{
    /**
     * Menampilkan Catatan Atas Laporan Keuangan (CALK) untuk tahun yang dipilih.
     */
    public function calk(Request $request): Response
    {
        $user = $request->user();

        $request->validate([
            'year' => 'nullable|numeric|digits:4',
        ]);

        $yearInput = $request->input('year');

        if (! $yearInput) {
            return Inertia::render('reports/calk', [
                'assets' => [],
                'cashBreakdown' => [],
                'liabilitiesBreakdown' => [],
                'equityBreakdown' => [],
                'totalAssetsVal' => 0,
                'totalCash' => 0,
                'totalLiabilities' => 0,
                'totalEquity' => 0,
                'hasAppliedFilter' => false,
                'filters' => [
                    'year' => '',
                ],
            ]);
        }

        $year = (int) $yearInput;
        $startDate = "{$year}-01-01";
        $endDate = "{$year}-12-31";

        // Susun rincian aset dan penyusutannya sampai akhir tahun laporan.
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

        // Rinci saldo akun kas dan bank sebagai komponen kas dan setara kas.
        $cashCoas = $user->coas()
            ->where('kategori', 'aset')
            ->orderBy('kode_akun')
            ->get()
            ->filter(fn($coa) => count(explode('.', $coa->kode_akun)) === 4)
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
            ->filter(fn($coa) => $coa->saldo != 0)
            ->values();

        return Inertia::render('reports/calk', [
            'assets' => $assets,
            'cashItems' => $cashCoas,
            'calkNotes' => $user->calk_notes,
            'hasAppliedFilter' => true,
            'filters' => [
                'year' => (string) $year,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Memperbarui catatan naratif CALK milik pengguna yang sedang login.
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
