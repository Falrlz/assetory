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
     * Pemetaan kelompok pajak aset ke umur ekonomis dalam tahun.
     */
    public const PERIODE_TAHUN = [
        'periode_1' => 4,
        'periode_2' => 8,
        'periode_3' => 16,
        'periode_4' => 20,
    ];

    /**
     * Atribut aset yang boleh diisi secara massal.
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
        'coa_debit_id',
        'coa_kredit_id',
    ];

    /**
     * Atribut hasil perhitungan yang otomatis disertakan dalam bentuk array dan JSON.
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
     * Menentukan tipe data atribut yang dibaca dari dan ditulis ke database.
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
     * Mendapatkan pengguna pemilik aset.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mendapatkan akun debit yang mencatat penambahan aset.
     */
    public function coaDebit(): BelongsTo
    {
        return $this->belongsTo(Coa::class, 'coa_debit_id');
    }

    /**
     * Mendapatkan akun kredit yang menjadi sumber pembayaran aset.
     */
    public function coaKredit(): BelongsTo
    {
        return $this->belongsTo(Coa::class, 'coa_kredit_id');
    }

    /**
     * Menghitung penyusutan per tahun dengan metode garis lurus.
     */
    public function getPenyusutanTahunanAttribute(): float
    {
        $depreciableAmount = max(0.0, (float) $this->harga_perolehan - (float) $this->nilai_residu);
        $umurTahun = self::PERIODE_TAHUN[$this->periode] ?? 4;

        return round($depreciableAmount / $umurTahun, 2);
    }

    /**
     * Menghitung penyusutan per bulan dengan metode garis lurus.
     */
    public function getPenyusutanBulananAttribute(): float
    {
        $depreciableAmount = max(0.0, (float) $this->harga_perolehan - (float) $this->nilai_residu);
        $umurTahun = self::PERIODE_TAHUN[$this->periode] ?? 4;
        $umurBulan = $umurTahun * 12;

        return round($depreciableAmount / $umurBulan, 2);
    }

    /**
     * Menghitung masa penggunaan berjalan dalam bulan tanpa melampaui umur ekonomis.
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
     * Menghitung akumulasi penyusutan hingga bulan berjalan.
     */
    public function getAkumulasiPenyusutanAttribute(): float
    {
        return round($this->penyusutan_bulanan * $this->masa_penggunaan_bulan, 2);
    }

    /**
     * Menghitung nilai buku aset saat ini.
     */
    public function getNilaiBukuAttribute(): float
    {
        $nilaiBuku = (float) $this->harga_perolehan - $this->akumulasi_penyusutan;

        return round(max(0.0, $nilaiBuku), 2);
    }
}
