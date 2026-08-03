<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Journal extends Model
{
    use HasFactory;

    /**
     * Atribut jurnal yang boleh diisi secara massal.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'tanggal',
        'nomor_jurnal',
        'keterangan',
        'tipe_jurnal',
        'ref_id',
        'jenis_transaksi',
        'kategori_arus_kas',
        'kode_arus_kas',
        'reversed_by_id',
        'reverses_journal_id',
    ];

    /**
     * Menentukan tipe data atribut yang dibaca dari dan ditulis ke database.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    /**
     * Mendapatkan pengguna pemilik jurnal.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mendapatkan seluruh baris debit dan kredit dalam jurnal.
     */
    public function items(): HasMany
    {
        return $this->hasMany(JournalItem::class);
    }

    /**
     * Mendapatkan aset terkait jika jurnal berasal dari transaksi aset.
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'ref_id');
    }

    /**
     * Mendapatkan jurnal pembalik yang membatalkan jurnal ini.
     */
    public function reversedBy(): BelongsTo
    {
        return $this->belongsTo(Journal::class, 'reversed_by_id');
    }

    /**
     * Mendapatkan jurnal asal yang dibatalkan oleh jurnal ini.
     */
    public function reversesJournal(): BelongsTo
    {
        return $this->belongsTo(Journal::class, 'reverses_journal_id');
    }

    /**
     * Membuat nomor jurnal berurutan untuk pengguna dan bulan berjalan.
     */
    public static function generateNumber($user, string $prefix = 'JV'): string
    {
        $yearMonth = now()->format('Ym');
        $searchPrefix = "{$prefix}-{$yearMonth}-";

        $latest = $user->journals()
            ->where('nomor_jurnal', 'like', "{$searchPrefix}%")
            ->orderBy('nomor_jurnal', 'desc')
            ->first();

        $nextNum = 1;
        if ($latest) {
            $parts = explode('-', $latest->nomor_jurnal);
            $nextNum = ((int) end($parts)) + 1;
        }

        return $searchPrefix.str_pad((string) $nextNum, 4, '0', STR_PAD_LEFT);
    }
}
