<?php

namespace App\Http\Controllers;

use App\Models\Journal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Menangani penayangan aset dan pencatatan perolehan aset beserta jurnalnya.
 */
class AssetController extends Controller
{
    /**
     * Menampilkan aset, jurnal aset terbaru, dan daftar akun milik pengguna.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $assets = $user->assets()
            ->orderBy('tanggal_perolehan', 'desc')
            ->orderBy('id', 'desc')
            ->get();

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
     * Menyimpan aset baru dan membuat jurnal perolehannya secara otomatis.
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
                Rule::exists('coas', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
            'coa_kredit_id' => [
                'required',
                Rule::exists('coas', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
        ]);

        $lockDate = $request->user()->lock_date;
        if ($lockDate && Carbon::parse($validated['tanggal_perolehan'])->lte($lockDate)) {
            throw ValidationException::withMessages([
                'tanggal_perolehan' => 'Tanggal perolehan aset tidak boleh kurang dari atau sama dengan tanggal penguncian periode ('.$lockDate->format('Y-m-d').').',
            ]);
        }

        $asset = $request->user()->assets()->create($validated);

        // Catat perolehan aset sebagai transaksi investasi yang merujuk ke aset baru.
        $journal = $request->user()->journals()->create([
            'tanggal' => $asset->tanggal_perolehan,
            'nomor_jurnal' => Journal::generateNumber($request->user(), 'JU-A'),
            'keterangan' => "Pencatatan perolehan aset tetap: {$asset->nama}",
            'tipe_jurnal' => 'perolehan_aset',
            'jenis_transaksi' => 'jurnal_umum',
            'kategori_arus_kas' => 'investasi',
            'kode_arus_kas' => 'JU-A',
            'ref_id' => $asset->id,
        ]);

        // Debit menambah akun aset tetap yang dipilih pengguna.
        $journal->items()->create([
            'coa_id' => $asset->coa_debit_id,
            'debit' => $asset->harga_perolehan,
            'kredit' => 0,
        ]);

        // Kredit mengurangi akun pembayaran atau mencatat sumber pendanaan yang dipilih.
        $journal->items()->create([
            'coa_id' => $asset->coa_kredit_id,
            'debit' => 0,
            'kredit' => $asset->harga_perolehan,
        ]);

        return redirect()->route('assets.index');
    }
}
