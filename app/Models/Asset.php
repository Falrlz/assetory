<?php

namespace App\Models;

use Database\Factories\AssetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Asset extends Model
{
    /** @use HasFactory<AssetFactory> */
    use HasFactory;

    /**
     * Opsi pemetaan periode (Kelompok Pajak) ke umur ekonomis (Tahun).
     */
    public const PERIODE_TAHUN = [
        'periode_1' => 4,
        'periode_2' => 8,
        'periode_3' => 16,
        'periode_4' => 20,
    ];

    /**
     * Attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nama',
        'jenis',
        'harga_perolehan',
        'nilai_residu',
        'tanggal_perolehan',
        'periode',
    ];

    /**
     * Attributes appended to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'penyusutan_tahunan',
        'penyusutan_bulanan',
        'masa_penggunaan_bulan',
        'akumulasi_penyusutan',
        'nilai_buku',
    ];

    /**
     * Define casts for the database columns.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'harga_perolehan' => 'decimal:2',
            'nilai_residu' => 'decimal:2',
            'tanggal_perolehan' => 'date',
        ];
    }

    /**
     * Relationship to the User model.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Hitung penyusutan per tahun.
     */
    public function getPenyusutanTahunanAttribute(): float
    {
        $depreciableAmount = max(0.0, (float) $this->harga_perolehan - (float) $this->nilai_residu);
        $umurTahun = self::PERIODE_TAHUN[$this->periode] ?? 4;

        return round($depreciableAmount / $umurTahun, 2);
    }

    /**
     * Hitung penyusutan per bulan.
     */
    public function getPenyusutanBulananAttribute(): float
    {
        $depreciableAmount = max(0.0, (float) $this->harga_perolehan - (float) $this->nilai_residu);
        $umurTahun = self::PERIODE_TAHUN[$this->periode] ?? 4;
        $umurBulan = $umurTahun * 12;

        return round($depreciableAmount / $umurBulan, 2);
    }

    /**
     * Hitung masa penggunaan berjalan dalam satuan bulan.
     */
    public function getMasaPenggunaanBulanAttribute(): int
    {
        if (! $this->tanggal_perolehan) {
            return 0;
        }

        $tanggalPerolehan = Carbon::parse($this->tanggal_perolehan)->startOfMonth();
        $sekarang = Carbon::now()->startOfMonth();

        if ($tanggalPerolehan->isFuture()) {
            return 0;
        }

        $umurTahun = self::PERIODE_TAHUN[$this->periode] ?? 4;
        $maxMasaBulan = $umurTahun * 12;

        $diffInMonths = $tanggalPerolehan->diffInMonths($sekarang);

        return min((int) $diffInMonths, $maxMasaBulan);
    }

    /**
     * Hitung akumulasi penyusutan hingga saat ini.
     */
    public function getAkumulasiPenyusutanAttribute(): float
    {
        return round($this->penyusutan_bulanan * $this->masa_penggunaan_bulan, 2);
    }

    /**
     * Hitung nilai buku saat ini (Book Value).
     */
    public function getNilaiBukuAttribute(): float
    {
        $nilaiBuku = (float) $this->harga_perolehan - $this->akumulasi_penyusutan;

        return round(max(0.0, $nilaiBuku), 2);
    }
}
