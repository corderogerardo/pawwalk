package com.pawwalk.android.data

/**
 * Single place that knows how to get data. Tries the backend; if it's not
 * running (common while you're learning), falls back to sample data so the UI
 * always has something to show.
 */
object WalkerRepository {
    private val api: PawWalkApi get() = Network.api

    suspend fun fetchWalkers(): List<Walker> = try {
        api.getWalkers()
    } catch (e: Exception) {
        sampleWalkers
    }

    val sampleWalkers = listOf(
        Walker("wlk_sam", "Sam Rivera", null, 4.9, 1800, "10 yrs with dogs. Loves huskies.", listOf("Mission", "SoMa")),
        Walker("wlk_ari", "Ari Chen", null, 4.8, 2000, "Certified trainer. Great with reactive dogs.", listOf("Mission", "Noe Valley")),
        Walker("wlk_jo", "Jo Park", null, 4.7, 1600, "Marathoner — your pup will be tired and happy.", listOf("SoMa", "Dogpatch")),
    )
}
