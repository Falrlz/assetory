<?php

use App\Http\Controllers\AssetController;
use App\Http\Controllers\CoaController;
use App\Http\Controllers\JournalController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('assets', [AssetController::class, 'index'])->name('assets.index');
    Route::post('assets', [AssetController::class, 'store'])->name('assets.store');

    Route::resource('coas', CoaController::class)->except(['create', 'edit', 'show']);

    Route::get('journals', [JournalController::class, 'index'])->name('journals.index');
    Route::post('journals', [JournalController::class, 'store'])->name('journals.store');
    Route::delete('journals/{id}', [JournalController::class, 'destroy'])->name('journals.destroy');
    Route::post('journals/depreciation', [JournalController::class, 'postDepreciation'])->name('journals.depreciation');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
