<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Memvalidasi data saat pengguna memperbarui profilnya.
 */
class ProfileUpdateRequest extends FormRequest
{
    /**
     * Mendapatkan aturan validasi untuk perubahan profil pengguna.
     *
     * Alamat email harus unik, kecuali alamat milik pengguna yang sedang
     * memperbarui profilnya sendiri.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }
}
