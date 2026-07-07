<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('coa_debit_id')->nullable()->constrained('coas')->onDelete('set null');
            $table->foreignId('coa_kredit_id')->nullable()->constrained('coas')->onDelete('set null');
            $table->string('nama');
            $table->enum('jenis', ['inventaris', 'kendaraan', 'gedung']);
            $table->decimal('harga_perolehan', 15, 2);
            $table->decimal('nilai_residu', 15, 2);
            $table->date('tanggal_perolehan');
            $table->enum('periode', ['periode_1', 'periode_2', 'periode_3', 'periode_4']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
