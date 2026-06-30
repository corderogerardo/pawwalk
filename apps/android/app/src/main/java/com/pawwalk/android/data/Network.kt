package com.pawwalk.android.data

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.pawwalk.android.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit

/**
 * One shared OkHttp/Retrofit setup for every repository, so the auth
 * interceptor (and any future cross-cutting concern) only has to be wired up
 * once instead of per-repository.
 */
object Network {
    private val json = Json { ignoreUnknownKeys = true }

    // Attaches the saved JWT to every outgoing request, when there is one.
    // Public endpoints (e.g. /walkers) ignore the header; the backend only
    // checks it on routes that require auth.
    private val authInterceptor = okhttp3.Interceptor { chain ->
        val token = TokenStore.getToken()
        val request = if (token != null) {
            chain.request().newBuilder().addHeader("Authorization", "Bearer $token").build()
        } else {
            chain.request()
        }
        chain.proceed(request)
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .build()

    val api: PawWalkApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(PawWalkApi::class.java)
    }
}
