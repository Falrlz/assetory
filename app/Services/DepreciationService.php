<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Journal;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DepreciationService
{
    /**
     * Post monthly depreciation journals for all active assets of a user.
     *
     * @throws ValidationException
     * @throws \Exception
     */
    public function postDepreciationForUser(User $user, string $bulan): void
    {
        $targetDate = Carbon::parse($bulan.'-01')->endOfMonth();

        // Check if already posted
        $alreadyPosted = $user->journals()
            ->where('tipe_jurnal', 'penyusutan')
            ->whereYear('tanggal', $targetDate->year)
            ->whereMonth('tanggal', $targetDate->month)
            ->exists();

        if ($alreadyPosted) {
            throw ValidationException::withMessages([
                'bulan' => 'Jurnal penyusutan untuk bulan '.$bulan.' sudah pernah diposting.',
            ]);
        }

        // Get all active assets for that month
        $assets = $user->assets()
            ->where('tanggal_perolehan', '<=', $targetDate)
            ->get();

        $depreciatedAssets = [];

        foreach ($assets as $asset) {
            $perolehan = Carbon::parse($asset->tanggal_perolehan)->startOfMonth();
            $diffInMonths = $perolehan->diffInMonths(Carbon::parse($bulan.'-01'));
            $maxMonths = (Asset::PERIODE_TAHUN[$asset->periode] ?? 4) * 12;

            if ($targetDate->isAfter($perolehan) || $targetDate->isSameDay($perolehan->endOfMonth())) {
                if ($diffInMonths < $maxMonths) {
                    $depreciatedAssets[] = $asset;
                }
            }
        }

        if (empty($depreciatedAssets)) {
            throw ValidationException::withMessages([
                'bulan' => 'Tidak ada aset aktif yang memerlukan penyusutan pada bulan '.$bulan.'.',
            ]);
        }

        DB::transaction(function () use ($user, $depreciatedAssets, $targetDate, $bulan) {
            foreach ($depreciatedAssets as $asset) {
                // Find Expense COA dynamically
                $bebanCoa = $user->coas()
                    ->where('nama_akun', 'like', 'Beban Penyusutan%')
                    ->where('nama_akun', 'like', '%'.$asset->jenis.'%')
                    ->first();

                if (! $bebanCoa) {
                    $suffixMap = ['gedung' => '01', 'kendaraan' => '02', 'inventaris' => '03'];
                    $suffix = $suffixMap[$asset->jenis] ?? '';
                    $bebanCoa = $user->coas()
                        ->where('kode_akun', '05.2000.03.'.$suffix)
                        ->first();
                }

                // Find Accumulation COA dynamically
                $akmCoa = $user->coas()
                    ->where('nama_akun', 'like', 'Akumulasi%')
                    ->where('nama_akun', 'like', '%'.$asset->jenis.'%')
                    ->first();

                if (! $akmCoa) {
                    $suffixMap = ['gedung' => '01', 'kendaraan' => '02', 'inventaris' => '03'];
                    $suffix = $suffixMap[$asset->jenis] ?? '';
                    $akmCoa = $user->coas()
                        ->where('kode_akun', '01.3000.02.'.$suffix)
                        ->first();
                }

                if (! $bebanCoa || ! $akmCoa) {
                    throw new \Exception("Akun COA penyusutan untuk jenis aset '{$asset->jenis}' tidak ditemukan. Mohon pastikan akun beban dan akumulasi penyusutan tersedia di COA.");
                }

                $journal = $user->journals()->create([
                    'tanggal' => $targetDate->format('Y-m-d'),
                    'nomor_jurnal' => Journal::generateNumber($user, 'DP-A'),
                    'keterangan' => "Penyusutan bulanan aset tetap: {$asset->nama} - Periode {$bulan}",
                    'tipe_jurnal' => 'penyusutan',
                    'jenis_transaksi' => null,
                    'kategori_arus_kas' => null,
                    'kode_arus_kas' => null,
                    'ref_id' => $asset->id,
                ]);

                // Debit: Beban Penyusutan
                $journal->items()->create([
                    'coa_id' => $bebanCoa->id,
                    'debit' => $asset->penyusutan_bulanan,
                    'kredit' => 0.00,
                ]);

                // Kredit: Akumulasi Penyusutan
                $journal->items()->create([
                    'coa_id' => $akmCoa->id,
                    'debit' => 0.00,
                    'kredit' => $asset->penyusutan_bulanan,
                ]);
            }
        });
    }
}
