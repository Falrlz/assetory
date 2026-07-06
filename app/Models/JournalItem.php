<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'journal_id',
        'coa_id',
        'debit',
        'kredit',
    ];

    /**
     * Get the attributes that should be cast.
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
     * Get the journal that owns the item.
     */
    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    /**
     * Get the chart of account (COA) for the item.
     */
    public function coa(): BelongsTo
    {
        return $this->belongsTo(Coa::class);
    }
}
