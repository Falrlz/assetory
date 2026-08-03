<?php

use App\Http\Controllers\Settings\AccountingSettingsController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Seluruh pengaturan bersifat pribadi sehingga hanya dapat diakses pengguna yang sudah masuk.
Route::middleware('auth')->group(function () {
    // Arahkan halaman utama pengaturan ke halaman profil sebagai halaman bawaan.
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    Route::get('settings/accounting', [AccountingSettingsController::class, 'edit'])->name('settings.accounting.edit');
    Route::patch('settings/accounting', [AccountingSettingsController::class, 'update'])->name('settings.accounting.update');
});
