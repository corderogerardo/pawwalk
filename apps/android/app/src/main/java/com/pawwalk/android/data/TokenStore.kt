package com.pawwalk.android.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Holds the JWT on disk. Backed by EncryptedSharedPreferences so the token
 * (and the master key protecting it) live in the Android Keystore instead of
 * a plaintext prefs file — worth it for something as sensitive as an auth
 * token, even in a learning app.
 */
object TokenStore {
    private const val PREFS_NAME = "pawwalk_secure_prefs"
    private const val KEY_TOKEN = "access_token"

    private lateinit var prefs: android.content.SharedPreferences

    fun init(context: Context) {
        if (::prefs.isInitialized) return
        val masterKey = MasterKey.Builder(context.applicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context.applicationContext,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun saveToken(token: String) = prefs.edit().putString(KEY_TOKEN, token).apply()

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun clear() = prefs.edit().remove(KEY_TOKEN).apply()
}
