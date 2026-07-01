package com.pawwalk.android.data

/**
 * Wraps the booking endpoints. Unlike WalkerRepository there's no sample-data
 * fallback — bookings require auth and are specific to the signed-in user, so
 * a failure should surface as an error rather than show fake data.
 */
object BookingRepository {
    private val api: PawWalkApi get() = Network.api

    suspend fun createBooking(request: CreateBookingRequest): Booking = api.createBooking(request)

    suspend fun fetchBookings(): List<Booking> = api.getBookings()

    suspend fun cancelBooking(bookingId: String): Booking = api.cancelBooking(bookingId)

    suspend fun simulateWalk(bookingId: String) = api.simulateWalk(bookingId)

    suspend fun assignedBookings(): List<Booking> = api.assignedBookings()

    /** action ∈ accept | decline | start | complete */
    suspend fun transition(bookingId: String, action: String): Booking = api.transitionBooking(bookingId, action)
}
