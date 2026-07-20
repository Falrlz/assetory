<?php

use App\Http\Controllers\AssetController;
use App\Http\Controllers\BeginningBalanceController;
use App\Http\Controllers\CoaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('assets', [AssetController::class, 'index'])->name('assets.index');
    Route::post('assets', [AssetController::class, 'store'])->name('assets.store');

    Route::get('beginning-balances', [BeginningBalanceController::class, 'index'])->name('beginning-balances.index');
    Route::post('beginning-balances', [BeginningBalanceController::class, 'store'])->name('beginning-balances.store');

    Route::resource('coas', CoaController::class)->except(['create', 'edit', 'show']);

    Route::get('journals', [JournalController::class, 'index'])->name('journals.index');
    Route::post('journals', [JournalController::class, 'store'])->name('journals.store');
    Route::delete('journals/{id}', [JournalController::class, 'destroy'])->name('journals.destroy');
    Route::post('journals/{id}/reverse', [JournalController::class, 'reverse'])->name('journals.reverse');
    Route::post('journals/depreciation', [JournalController::class, 'postDepreciation'])->name('journals.depreciation');

    // Financial Reports
    Route::get('reports/trial-balance', [ReportController::class, 'trialBalance'])->name('reports.trial-balance');
    Route::get('reports/balance-sheet', [ReportController::class, 'balanceSheet'])->name('reports.balance-sheet');
    Route::get('reports/profit-loss', [ReportController::class, 'profitLoss'])->name('reports.profit-loss');
    Route::get('reports/cash-flow', [ReportController::class, 'cashFlow'])->name('reports.cash-flow');
    Route::get('reports/equity-change', [ReportController::class, 'equityChange'])->name('reports.equity-change');
    Route::get('reports/calk', [ReportController::class, 'calk'])->name('reports.calk');
    Route::post('reports/calk', [ReportController::class, 'updateCalk'])->name('reports.calk.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
