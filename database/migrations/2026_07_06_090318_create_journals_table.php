<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Membuat kepala jurnal sebagai identitas dan konteks setiap transaksi. */
    public function up(): void
    {
        Schema::create('journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('nomor_jurnal');
            $table->text('keterangan');
            $table->enum('tipe_jurnal', ['umum', 'perolehan_aset', 'penyusutan']);
            $table->unsignedBigInteger('ref_id')->nullable(); // ID aset jika jurnal berasal dari perolehan atau penyusutan.
            $table->string('jenis_transaksi')->nullable(); // Contoh: jurnal umum, kas masuk, atau jurnal koreksi.
            $table->string('kategori_arus_kas')->nullable(); // Operasional, investasi, atau pendanaan.
            $table->string('kode_arus_kas')->nullable(); // Contoh: JU-O.
            $table->timestamps();

            // Nomor jurnal hanya wajib unik di dalam pembukuan pengguna yang sama.
            $table->unique(['user_id', 'nomor_jurnal']);
        });
    }

    /** Menghapus tabel kepala jurnal. */
    public function down(): void
    {
        Schema::dropIfExists('journals');
    }
};
