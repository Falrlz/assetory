<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountingSettingsController extends Controller
{
    /**
     * Menampilkan pengaturan tanggal penguncian periode akuntansi.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/accounting', [
            'lockDate' => $request->user()->lock_date?->format('Y-m-d'),
        ]);
    }

    /**
     * Memperbarui batas tanggal transaksi yang sudah dikunci.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lock_date' => 'nullable|date',
        ]);

        $request->user()->update([
            'lock_date' => $validated['lock_date'],
        ]);

        return redirect()->back();
    }
}
