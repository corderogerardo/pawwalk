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

    suspend fun createPaymentIntent(bookingId: String): PaymentIntentResponse =
        api.createPaymentIntent(PaymentIntentRequest(bookingId))
}
