<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Journal extends Model
{
    use HasFactory;

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
    ];

    /**
     * Get the attributes that should be cast.
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
     * Get the user that owns the journal.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the items for the journal.
     */
    public function items(): HasMany
    {
        return $this->hasMany(JournalItem::class);
    }

    /**
     * Generate a unique sequential journal number for a user.
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
