package com.pawwalk.android.data

/**
 * Single place that knows how to get walker data. No sample-data fallback —
 * if the backend is unreachable the caller shows a real error state, same as
 * the booking and auth flows.
 */
object WalkerRepository {
    private val api: PawWalkApi get() = Network.api

    suspend fun fetchWalkers(): List<Walker> = api.getWalkers()

    suspend fun myProfile(): Walker = api.walkerProfile()

    suspend fun updateProfile(update: WalkerProfileUpdate): Walker = api.updateWalkerProfile(update)
}
