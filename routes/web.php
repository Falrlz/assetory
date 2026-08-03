<?php

/**
 * Route web utama aplikasi Assetory.
 *
 * File ini menghubungkan URL yang diakses dari browser dengan method controller
 * yang menangani permintaan tersebut. Route GET digunakan untuk mengambil atau
 * menampilkan halaman, POST untuk membuat data atau menjalankan suatu proses,
 * PUT/PATCH untuk memperbarui data, dan DELETE untuk menghapus data.
 */

use App\Http\Controllers\AssetController;
use App\Http\Controllers\BeginningBalanceController;
use App\Http\Controllers\CoaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\Reports\BalanceSheetController;
use App\Http\Controllers\Reports\CalkController;
use App\Http\Controllers\Reports\CashFlowController;
use App\Http\Controllers\Reports\EquityChangeController;
use App\Http\Controllers\Reports\ProfitLossController;
use App\Http\Controllers\Reports\TrialBalanceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Halaman beranda bersifat publik, sehingga dapat dibuka tanpa harus masuk.
// Controller tidak diperlukan karena route ini langsung merender halaman React
// `resources/js/pages/welcome.tsx` melalui Inertia.
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

/**
 * Route aplikasi yang dilindungi middleware `auth`.
 *
 * Sebelum controller dijalankan, middleware memastikan pengunjung memiliki sesi
 * login yang sah. Pengunjung yang belum masuk akan diarahkan ke halaman login.
 */
Route::middleware(['auth'])->group(function () {
    // Dashboard: GET hanya mengambil ringkasan data dan menampilkan halaman utama.
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    /*
     * Aset
     * GET  /assets menampilkan daftar dan formulir aset.
     * POST /assets memvalidasi lalu menyimpan aset baru beserta jurnal terkait.
     */
    Route::get('assets', [AssetController::class, 'index'])->name('assets.index');
    Route::post('assets', [AssetController::class, 'store'])->name('assets.store');

    /*
     * Saldo awal
     * GET  /beginning-balances menampilkan data/formulir saldo awal.
     * POST /beginning-balances menyimpan saldo awal yang dikirim pengguna.
     */
    Route::get('beginning-balances', [BeginningBalanceController::class, 'index'])->name('beginning-balances.index');
    Route::post('beginning-balances', [BeginningBalanceController::class, 'store'])->name('beginning-balances.store');

    /*
     * Chart of Accounts (COA)
     *
     * Route::resource membentuk route CRUD mengikuti konvensi Laravel. Karena
     * action create, edit, dan show dikecualikan, route yang dihasilkan adalah:
     * - GET    /coas       -> index: menampilkan daftar COA;
     * - POST   /coas       -> store: menyimpan COA baru;
     * - PUT/PATCH /coas/{coa} -> update: memperbarui COA tertentu;
     * - DELETE /coas/{coa} -> destroy: menghapus COA tertentu.
     *
     * `{coa}` adalah parameter dinamis yang mengidentifikasi data COA tujuan.
     */
    Route::resource('coas', CoaController::class)->except(['create', 'edit', 'show']);

    /*
     * Jurnal
     * GET    /journals menampilkan daftar dan formulir jurnal.
     * POST   /journals memvalidasi lalu menyimpan jurnal baru.
     * DELETE /journals/{id} menghapus jurnal berdasarkan ID.
     * POST   /journals/{id}/reverse membuat pembalikan untuk jurnal berdasarkan ID.
     * POST   /journals/depreciation menjalankan posting jurnal penyusutan aset.
     *
     * `{id}` adalah parameter URL dinamis. Nilainya diteruskan ke controller agar
     * controller dapat menemukan jurnal yang hendak dihapus atau dibalik.
     */
    Route::get('journals', [JournalController::class, 'index'])->name('journals.index');
    Route::post('journals', [JournalController::class, 'store'])->name('journals.store');
    Route::delete('journals/{id}', [JournalController::class, 'destroy'])->name('journals.destroy');
    Route::post('journals/{id}/reverse', [JournalController::class, 'reverse'])->name('journals.reverse');
    Route::post('journals/depreciation', [JournalController::class, 'postDepreciation'])->name('journals.depreciation');

    /*
     * Laporan keuangan
     *
     * Seluruh endpoint GET membaca jurnal milik pengguna yang sedang masuk,
     * menghitung laporan, lalu menampilkan halaman laporan melalui Inertia.
     */
    // Menampilkan neraca saldo untuk periode yang dipilih.
    Route::get('reports/trial-balance', [TrialBalanceController::class, 'trialBalance'])->name('reports.trial-balance');

    // Menampilkan posisi aset, kewajiban, dan ekuitas pada laporan neraca.
    Route::get('reports/balance-sheet', [BalanceSheetController::class, 'balanceSheet'])->name('reports.balance-sheet');

    // Menampilkan pendapatan, beban, dan laba atau rugi periode berjalan.
    Route::get('reports/profit-loss', [ProfitLossController::class, 'profitLoss'])->name('reports.profit-loss');

    // Menampilkan arus kas operasional, investasi, dan pendanaan.
    Route::get('reports/cash-flow', [CashFlowController::class, 'cashFlow'])->name('reports.cash-flow');

    // Menampilkan perubahan saldo ekuitas selama periode laporan.
    Route::get('reports/equity-change', [EquityChangeController::class, 'equityChange'])->name('reports.equity-change');

    // GET menampilkan Catatan atas Laporan Keuangan (CALK).
    Route::get('reports/calk', [CalkController::class, 'calk'])->name('reports.calk');

    // POST memvalidasi dan menyimpan perubahan catatan naratif CALK.
    Route::post('reports/calk', [CalkController::class, 'updateCalk'])->name('reports.calk.update');
});

// Memuat route pengaturan profil, kata sandi, tampilan, dan pengaturan pengguna.
require __DIR__.'/settings.php';

// Memuat route autentikasi seperti register, login, logout, dan reset kata sandi.
require __DIR__.'/auth.php';
