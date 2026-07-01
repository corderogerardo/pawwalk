package com.pawwalk.android.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
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

    @POST("auth/signup")
    suspend fun signup(@Body request: SignupRequest): AuthResponse

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @GET("auth/me")
    suspend fun me(): User

    @POST("assistant/chat")
    suspend fun assistantChat(@Body request: AssistantChatRequest): AssistantReply

    @POST("bookings/{id}/simulate")
    suspend fun simulateWalk(@Path("id") bookingId: String): SimulateAck

    // Pets (owner)
    @GET("pets")
    suspend fun getPets(): List<Pet>

    @POST("pets")
    suspend fun createPet(@Body request: CreatePetRequest): Pet

    @DELETE("pets/{id}")
    suspend fun deletePet(@Path("id") petId: String): Response<Unit>

    // Walker workflow
    @GET("walkers/me")
    suspend fun walkerProfile(): Walker

    @PATCH("walkers/me")
    suspend fun updateWalkerProfile(@Body update: WalkerProfileUpdate): Walker

    @GET("bookings/assigned")
    suspend fun assignedBookings(): List<Booking>

    @POST("bookings/{id}/{action}")
    suspend fun transitionBooking(@Path("id") id: String, @Path("action") action: String): Booking
}
