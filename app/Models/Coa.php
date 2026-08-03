<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coa extends Model
{
    use HasFactory;

    /**
     * Atribut akun yang boleh diisi secara massal.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'kode_akun',
        'nama_akun',
        'kategori',
        'saldo_normal',
        'jenis_laporan',
    ];

    /**
     * Mendapatkan pengguna pemilik akun.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mendapatkan seluruh baris jurnal yang menggunakan akun ini.
     */
    public function journalItems(): HasMany
    {
        return $this->hasMany(JournalItem::class);
    }
}
