<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Journal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    /**
     * Display a listing of the user's assets.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('assets/index', [
            'assets' => $request->user()->assets()->latest()->get(),
        ]);
    }

    /**
     * Store a newly created asset in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'jenis' => ['required', 'string', 'in:inventaris,kendaraan,gedung'],
            'harga_perolehan' => ['required', 'numeric', 'min:0'],
            'nilai_residu' => ['required', 'numeric', 'min:0', 'lte:harga_perolehan'],
            'tanggal_perolehan' => ['required', 'date'],
            'periode' => ['required', 'string', 'in:periode_1,periode_2,periode_3,periode_4'],
        ]);

        $asset = $request->user()->assets()->create($validated);

        // Otomatisasi Jurnal Perolehan Aset
        $cashCoa = $request->user()->coas()->where('kode_akun', '1-1000')->first();
        $assetCoaCode = match ($asset->jenis) {
            'inventaris' => '1-3000',
            'kendaraan' => '1-4000',
            'gedung' => '1-5000',
            default => null,
        };
        $assetCoa = $assetCoaCode ? $request->user()->coas()->where('kode_akun', $assetCoaCode)->first() : null;

        if ($cashCoa && $assetCoa) {
            $journal = $request->user()->journals()->create([
                'tanggal' => $asset->tanggal_perolehan,
                'nomor_jurnal' => Journal::generateNumber($request->user()),
                'keterangan' => "Pencatatan perolehan aset tetap: {$asset->nama}",
                'tipe_jurnal' => 'perolehan_aset',
                'ref_id' => $asset->id,
            ]);

            // Debit: Akun Aset Tetap
            $journal->items()->create([
                'coa_id' => $assetCoa->id,
                'debit' => $asset->harga_perolehan,
                'kredit' => 0,
            ]);

            // Kredit: Kas & Bank
            $journal->items()->create([
                'coa_id' => $cashCoa->id,
                'debit' => 0,
                'kredit' => $asset->harga_perolehan,
            ]);
        }

        return redirect()->route('assets.index');
    }
}
