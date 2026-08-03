<?php

namespace App\Models;

// Aktifkan kontrak MustVerifyEmail jika verifikasi email ingin diwajibkan.
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Atribut pengguna yang boleh diisi secara massal.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'lock_date',
        'calk_notes',
    ];

    /**
     * Atribut sensitif yang tidak disertakan saat model diubah menjadi array atau JSON.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Menentukan tipe data dan transformasi otomatis untuk atribut pengguna.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'lock_date' => 'date',
        ];
    }

    /**
     * Mendapatkan seluruh aset milik pengguna.
     *
     * @return HasMany<Asset>
     */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }

    /**
     * Mendapatkan seluruh daftar akun milik pengguna.
     *
     * @return HasMany<Coa>
     */
    public function coas(): HasMany
    {
        return $this->hasMany(Coa::class);
    }

    /**
     * Mendapatkan seluruh jurnal milik pengguna.
     *
     * @return HasMany<Journal>
     */
    public function journals(): HasMany
    {
        return $this->hasMany(Journal::class);
    }
}
