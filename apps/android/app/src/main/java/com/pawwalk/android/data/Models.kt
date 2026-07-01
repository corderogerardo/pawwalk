package com.pawwalk.android.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Mirrors docs/API-CONTRACT.md. @SerialName maps idiomatic Kotlin names to the
// snake_case JSON the backend emits.
@Serializable
data class Walker(
    val id: String,
    val name: String,
    @SerialName("photo_url") val photoUrl: String? = null,
    val rating: Double,
    @SerialName("price_per_30min_cents") val pricePer30MinCents: Int,
    val bio: String = "",
    val neighborhoods: List<String> = emptyList(),
) {
    val priceLabel: String get() = "$%.0f / 30 min".format(pricePer30MinCents / 100.0)
}

@Serializable
data class CreateBookingRequest(
    @SerialName("walker_id") val walkerId: String,
    @SerialName("dog_name") val dogName: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_minutes") val durationMinutes: Int = 30,
    val notes: String? = null,
)

@Serializable
data class Booking(
    val id: String,
    @SerialName("walker_id") val walkerId: String,
    @SerialName("dog_name") val dogName: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    val status: String,
    @SerialName("price_cents") val priceCents: Int,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String,
    val role: String = "owner",
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class AuthResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("token_type") val tokenType: String,
    val user: User,
)

@Serializable
data class SignupRequest(
    val email: String,
    val password: String,
    val name: String,
    val role: String = "owner",
)

@Serializable
data class Pet(
    val id: String,
    val name: String,
    val breed: String = "",
    @SerialName("age_years") val ageYears: Double? = null,
    @SerialName("weight_kg") val weightKg: Double? = null,
    val notes: String = "",
    @SerialName("created_at") val createdAt: String,
) {
    val subtitle: String get() = listOfNotNull(
        breed.ifBlank { null },
        ageYears?.let { "${it.toInt()} yrs" },
        weightKg?.let { "%.1f kg".format(it) },
    ).joinToString(" · ")
}

@Serializable
data class CreatePetRequest(
    val name: String,
    val breed: String = "",
    @SerialName("age_years") val ageYears: Double? = null,
    @SerialName("weight_kg") val weightKg: Double? = null,
    val notes: String? = null,
)

@Serializable
data class WalkerProfileUpdate(
    val bio: String? = null,
    @SerialName("price_per_30min_cents") val pricePer30MinCents: Int? = null,
    val neighborhoods: List<String>? = null,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

// ---- AI assistant (mirrors docs/API-CONTRACT.md) ----

@Serializable
data class AssistantChatRequest(
    val message: String,
)

@Serializable
data class DraftBooking(
    @SerialName("walker_id") val walkerId: String,
    @SerialName("dog_name") val dogName: String? = null,
    @SerialName("start_time") val startTime: String? = null,
    @SerialName("duration_minutes") val durationMinutes: Int = 30,
)

@Serializable
data class AssistantReply(
    val reply: String,
    @SerialName("suggested_walkers") val suggestedWalkers: List<String> = emptyList(),
    @SerialName("draft_booking") val draftBooking: DraftBooking? = null,
)

@Serializable
data class SimulateAck(val status: String = "", val points: Int = 0)

// ---- Owner home stats (GET /bookings/stats) ----

@Serializable
data class RecentWalk(
    @SerialName("booking_id") val bookingId: String,
    @SerialName("dog_name") val dogName: String,
    @SerialName("walker_name") val walkerName: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    @SerialName("distance_km") val distanceKm: Double,
    // Per-segment distance profile of the recorded track, 6 values in 0..1
    // (empty when the walk had no GPS track). Drives the sparkline.
    val sparkline: List<Double> = emptyList(),
)

@Serializable
data class OwnerStats(
    @SerialName("distance_km") val distanceKm: Double,
    @SerialName("streak_days") val streakDays: Int,
    @SerialName("recent_walks") val recentWalks: List<RecentWalk> = emptyList(),
)
