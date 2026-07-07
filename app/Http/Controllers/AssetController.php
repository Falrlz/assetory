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
        $user = $request->user();
        $assets = $user->assets()->latest()->get();

        $assetJournals = $user->journals()
            ->whereIn('tipe_jurnal', ['perolehan_aset', 'penyusutan'])
            ->with(['items.coa'])
            ->latest()
            ->take(10)
            ->get();

        $coas = $user->coas()->orderBy('kode_akun')->get();

        return Inertia::render('assets/index', [
            'assets' => $assets,
            'assetJournals' => $assetJournals,
            'coas' => $coas,
        ]);
    }

    /**
     * Store a newly created asset in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'jenis' => ['required', 'string', 'in:inventaris,kendaraan,gedung'],
            'harga_perolehan' => ['required', 'numeric', 'min:0'],
            'nilai_residu' => ['required', 'numeric', 'min:0', 'lte:harga_perolehan'],
            'tanggal_perolehan' => ['required', 'date'],
            'periode' => ['required', 'string', 'in:periode_1,periode_2,periode_3,periode_4'],
            'coa_debit_id' => [
                'required',
                \Illuminate\Validation\Rule::exists('coas', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
            'coa_kredit_id' => [
                'required',
                \Illuminate\Validation\Rule::exists('coas', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
        ]);

        $asset = $request->user()->assets()->create($validated);

        // Otomatisasi Jurnal Perolehan Aset
        $journal = $request->user()->journals()->create([
            'tanggal' => $asset->tanggal_perolehan,
            'nomor_jurnal' => Journal::generateNumber($request->user()),
            'keterangan' => "Pencatatan perolehan aset tetap: {$asset->nama}",
            'tipe_jurnal' => 'perolehan_aset',
            'ref_id' => $asset->id,
        ]);

        // Debit: Akun Aset Tetap terpilih
        $journal->items()->create([
            'coa_id' => $asset->coa_debit_id,
            'debit' => $asset->harga_perolehan,
            'kredit' => 0,
        ]);

        // Kredit: Akun Pembayaran terpilih
        $journal->items()->create([
            'coa_id' => $asset->coa_kredit_id,
            'debit' => 0,
            'kredit' => $asset->harga_perolehan,
        ]);

        return redirect()->route('assets.index');
    }
}
