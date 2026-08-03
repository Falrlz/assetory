<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Menjadi titik pendaftaran dan inisialisasi layanan khusus aplikasi.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Mendaftarkan layanan aplikasi ke dalam service container.
     */
    public function register(): void
    {
        //
    }

    /**
     * Menjalankan konfigurasi layanan setelah seluruh provider didaftarkan.
     */
    public function boot(): void
    {
        //
    }
}
