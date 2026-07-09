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
        Schema::create('journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('nomor_jurnal');
            $table->text('keterangan');
            $table->enum('tipe_jurnal', ['umum', 'perolehan_aset', 'penyusutan']);
            $table->unsignedBigInteger('ref_id')->nullable(); // ID Aset jika bersumber dari perolehan/penyusutan aset
            $table->string('jenis_transaksi')->nullable(); // jurnal_umum, kas_masuk, kas_keluar, bank_masuk, bank_keluar, jurnal_koreksi
            $table->string('kategori_arus_kas')->nullable(); // operasional, investasi, pendanaan
            $table->string('kode_arus_kas')->nullable(); // e.g. JU-O
            $table->timestamps();

            // Nomor jurnal harus unik per user
            $table->unique(['user_id', 'nomor_jurnal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journals');
    }
};
