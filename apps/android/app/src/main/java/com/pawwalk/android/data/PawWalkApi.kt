package com.pawwalk.android.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

// Retrofit turns this interface into a working HTTP client at runtime.
interface PawWalkApi {
    @GET("walkers")
    suspend fun getWalkers(): List<Walker>

    @POST("bookings")
    suspend fun createBooking(@Body request: CreateBookingRequest): Booking

    @GET("bookings")
    suspend fun getBookings(): List<Booking>

    @POST("bookings/{id}/cancel")
    suspend fun cancelBooking(@Path("id") bookingId: String): Booking

    @POST("payments/intent")
    suspend fun createPaymentIntent(@Body request: PaymentIntentRequest): PaymentIntentResponse

    @POST("auth/signup")
    suspend fun signup(@Body request: SignupRequest): AuthResponse

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @GET("auth/me")
    suspend fun me(): User
}
