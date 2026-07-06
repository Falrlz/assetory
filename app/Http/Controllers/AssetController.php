<?php

namespace App\Http\Controllers;

use App\Models\Asset;
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

        $request->user()->assets()->create($validated);

        return redirect()->route('assets.index');
    }
}
