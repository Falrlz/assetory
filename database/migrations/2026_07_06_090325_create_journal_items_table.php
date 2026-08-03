<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Membuat rincian debit dan kredit untuk setiap kepala jurnal. */
    public function up(): void
    {
        Schema::create('journal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('coa_id')->constrained()->cascadeOnDelete();
            $table->decimal('debit', 15, 2)->default(0.00);
            $table->decimal('kredit', 15, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /** Menghapus tabel rincian jurnal. */
    public function down(): void
    {
        Schema::dropIfExists('journal_items');
    }
};
