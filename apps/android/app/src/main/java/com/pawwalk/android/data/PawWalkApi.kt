package com.pawwalk.android.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

// Retrofit turns this interface into a working HTTP client at runtime.
interface PawWalkApi {
    @GET("walkers")
    suspend fun getWalkers(): List<Walker>

    @POST("bookings")
    suspend fun createBooking(@Body request: CreateBookingRequest): Booking
}
