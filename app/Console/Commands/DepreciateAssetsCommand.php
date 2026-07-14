<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\DepreciationService;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

class DepreciateAssetsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'asset:depreciate {--month= : Bulan target YYYY-MM}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Proses jurnal depresiasi bulanan secara massal untuk seluruh pengguna.';

    /**
     * Create a new command instance.
     */
    public function __construct(protected DepreciationService $depreciationService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $month = $this->option('month') ?: now()->format('Y-m');

        if (! preg_match('/^\d{4}-\d{2}$/', $month)) {
            $this->error('Format bulan tidak valid. Harus menggunakan format YYYY-MM (contoh: 2026-07).');

            return self::FAILURE;
        }

        $this->info("Memulai pemrosesan depresiasi aset untuk periode: {$month}");

        $users = User::all();
        $successCount = 0;
        $skippedCount = 0;
        $errorCount = 0;

        foreach ($users as $user) {
            try {
                $this->depreciationService->postDepreciationForUser($user, $month);
                $this->info("Sukses: Jurnal penyusutan berhasil dibuat untuk {$user->name} ({$user->email})");
                $successCount++;
            } catch (ValidationException $e) {
                $errorMsg = collect($e->errors())->flatten()->first();
                $this->line("Dilewati: User {$user->name} ({$user->email}) -> {$errorMsg}");
                $skippedCount++;
            } catch (\Exception $e) {
                $this->error("Gagal: Terjadi kesalahan untuk {$user->name} ({$user->email}) -> ".$e->getMessage());
                $errorCount++;
            }
        }

        $this->info("Pemrosesan selesai secara massal. Sukses: {$successCount}, Dilewati: {$skippedCount}, Gagal: {$errorCount}");

        return self::SUCCESS;
    }
}
