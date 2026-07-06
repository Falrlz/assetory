<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Coa extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'kode_akun',
        'nama_akun',
        'kategori',
        'saldo_normal',
    ];

    /**
     * Get the user that owns the account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
