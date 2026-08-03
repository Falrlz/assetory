<?php

namespace App\Http\Controllers;

use App\Models\Coa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Mengelola daftar akun (Chart of Accounts/COA) milik pengguna.
 */
class CoaController extends Controller
{
    /**
     * Menampilkan seluruh akun milik pengguna yang sedang login.
     */
    public function index(): Response
    {
        $coas = auth()->user()->coas()
            ->orderBy('kode_akun')
            ->get();

        return Inertia::render('coas/index', [
            'coas' => $coas,
        ]);
    }

    /**
     * Menyimpan akun baru dengan kode yang unik untuk pengguna tersebut.
     */
    public function store(Request $request): RedirectResponse
    {
        $userId = auth()->id();

        $validated = $request->validate([
            'kode_akun' => [
                'required',
                'string',
                'max:50',
                Rule::unique('coas')->where(function ($query) use ($userId) {
                    return $query->where('user_id', $userId);
                }),
            ],
            'nama_akun' => 'required|string|max:255',
            'kategori' => 'required|in:aset,kewajiban,ekuitas,pendapatan,beban',
            'saldo_normal' => 'required|in:debit,kredit',
            'jenis_laporan' => 'required|in:LPK,LR',
        ]);

        auth()->user()->coas()->create($validated);

        return redirect()->back();
    }

    /**
     * Memperbarui akun milik pengguna tanpa mengubah batas kepemilikannya.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        /** @var Coa $coa */
        $coa = auth()->user()->coas()->findOrFail($id);

        $userId = auth()->id();
        $validated = $request->validate([
            'kode_akun' => [
                'required',
                'string',
                'max:50',
                Rule::unique('coas')->where(function ($query) use ($userId) {
                    return $query->where('user_id', $userId);
                })->ignore($coa->id),
            ],
            'nama_akun' => 'required|string|max:255',
            'kategori' => 'required|in:aset,kewajiban,ekuitas,pendapatan,beban',
            'saldo_normal' => 'required|in:debit,kredit',
            'jenis_laporan' => 'required|in:LPK,LR',
        ]);

        $coa->update($validated);

        return redirect()->back();
    }

    /**
     * Menghapus akun jika belum pernah digunakan pada item jurnal.
     */
    public function destroy(int $id): RedirectResponse
    {
        /** @var Coa $coa */
        $coa = auth()->user()->coas()->findOrFail($id);

        if ($coa->journalItems()->exists()) {
            return redirect()->back()->withErrors([
                'error' => 'Akun COA tidak dapat dihapus karena telah memiliki transaksi jurnal tercatat.',
            ]);
        }

        $coa->delete();

        return redirect()->back();
    }
}
