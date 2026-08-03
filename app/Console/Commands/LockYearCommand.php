<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Mengunci periode pembukuan seluruh pengguna pada akhir tahun buku.
 */
class LockYearCommand extends Command
{
    /**
     * Nama, argumen, dan opsi perintah console.
     *
     * @var string
     */
    protected $signature = 'app:lock-year {--year= : Tahun buku yang akan dikunci (YYYY)}';

    /**
     * Deskripsi perintah yang ditampilkan pada daftar Artisan.
     *
     * @var string
     */
    protected $description = 'Secara otomatis mengunci pembukuan per 31 Desember untuk tahun buku sebelumnya.';

    /**
     * Mengunci pembukuan seluruh pengguna pada akhir tahun yang ditentukan.
     */
    public function handle(): int
    {
        // Tanpa opsi --year, tahun buku sebelumnya menjadi target bawaan.
        $targetYear = $this->option('year') ?: Carbon::now()->subYear()->year;

        $lockDate = "{$targetYear}-12-31";

        User::query()->update(['lock_date' => $lockDate]);

        $this->info("Sukses: Pembukuan untuk seluruh pengguna berhasil dikunci per {$lockDate}.");

        return self::SUCCESS;
    }
}
