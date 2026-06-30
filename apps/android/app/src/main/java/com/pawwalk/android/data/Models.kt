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
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class PaymentIntentRequest(
    @SerialName("booking_id") val bookingId: String,
)

@Serializable
data class PaymentIntentResponse(
    @SerialName("client_secret") val clientSecret: String,
    @SerialName("amount_cents") val amountCents: Int,
)
