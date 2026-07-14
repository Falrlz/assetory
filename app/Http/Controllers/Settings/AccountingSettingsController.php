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
     * Show the accounting settings form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/accounting', [
            'lockDate' => $request->user()->lock_date?->format('Y-m-d'),
        ]);
    }

    /**
     * Update the accounting lock date.
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
