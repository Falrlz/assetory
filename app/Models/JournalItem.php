<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalItem extends Model
{
    use HasFactory;

    /**
     * Atribut baris jurnal yang boleh diisi secara massal.
     *
     * @var list<string>
     */
    protected $fillable = [
        'journal_id',
        'coa_id',
        'debit',
        'kredit',
    ];

    /**
     * Menentukan nilai debit dan kredit sebagai desimal dua angka.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'debit' => 'decimal:2',
            'kredit' => 'decimal:2',
        ];
    }

    /**
     * Mendapatkan jurnal induk dari baris ini.
     */
    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    /**
     * Mendapatkan akun COA yang digunakan oleh baris jurnal ini.
     */
    public function coa(): BelongsTo
    {
        return $this->belongsTo(Coa::class);
    }
}
