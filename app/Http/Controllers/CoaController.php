<?php

namespace App\Http\Controllers;

use App\Models\Coa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CoaController extends Controller
{
    /**
     * Display a listing of the resource.
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
     * Store a newly created resource in storage.
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
        ]);

        auth()->user()->coas()->create($validated);

        return redirect()->back();
    }

    /**
     * Update the specified resource in storage.
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
        ]);

        $coa->update($validated);

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): RedirectResponse
    {
        /** @var Coa $coa */
        $coa = auth()->user()->coas()->findOrFail($id);

        $coa->delete();

        return redirect()->back();
    }
}
