<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Menambahkan catatan naratif CALK milik pengguna. */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('calk_notes')->nullable()->after('lock_date');
        });
    }

    /** Menghapus catatan CALK dari tabel pengguna. */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('calk_notes');
        });
    }
};
