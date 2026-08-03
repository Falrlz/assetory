<?php

namespace App\Providers;

use App\Listeners\CreateDefaultCoasListener;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;
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
        Event::listen(Registered::class, CreateDefaultCoasListener::class);
    }
}
