<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class LockYearCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:lock-year {--year= : Tahun buku yang akan dikunci (YYYY)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Secara otomatis mengunci pembukuan per 31 Desember untuk tahun buku sebelumnya.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // Jika opsi --year diisi, gunakan itu. Jika tidak, gunakan tahun kemarin.
        $targetYear = $this->option('year') ?: Carbon::now()->subYear()->year;
        
        $lockDate = "{$targetYear}-12-31";

        User::query()->update(['lock_date' => $lockDate]);

        $this->info("Sukses: Pembukuan untuk seluruh pengguna berhasil dikunci per {$lockDate}.");

        return self::SUCCESS;
    }
}
