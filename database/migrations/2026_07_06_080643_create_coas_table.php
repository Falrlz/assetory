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
        Schema::create('coas', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('user_id')->constrained()->cascadeOnDelete();
            $blueprint->string('kode_akun');
            $blueprint->string('nama_akun');
            $blueprint->enum('kategori', ['aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban']);
            $blueprint->enum('saldo_normal', ['debit', 'kredit']);
            $blueprint->enum('jenis_laporan', ['LPK', 'LR'])->nullable();
            $blueprint->timestamps();

            // Kode akun harus unik per masing-masing pengguna
            $blueprint->unique(['user_id', 'kode_akun']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coas');
    }
};
