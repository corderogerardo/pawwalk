package com.pawwalk.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pawwalk.android.data.Booking
import com.pawwalk.android.data.BookingRepository
import com.pawwalk.android.data.OwnerStats
import com.pawwalk.android.data.Network
import com.pawwalk.android.data.Pet
import com.pawwalk.android.data.PetRepository
import com.pawwalk.android.data.Walker
import com.pawwalk.android.data.WalkerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Duration
import java.time.Instant

/**
 * Backs HomeScreen with the signed-in user's real bookings (mirrors the iOS
 * HomeViewModel — see docs/FUNCTIONAL-REVIEW.md N3). Derives the "next walk" and
 * a this-week count; distance/streak/recent walks come from GET /bookings/stats.
 */
class HomeViewModel : ViewModel() {
    data class UpcomingWalk(val booking: Booking, val walker: Walker?)
    data class HomeState(
        val upcoming: UpcomingWalk? = null,
        val weekCount: Int = 0,
        val pets: List<Pet> = emptyList(),
        val stats: OwnerStats? = null,
    )

    private val _state = MutableStateFlow(HomeState())
    val state: StateFlow<HomeState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            val bookings = try { BookingRepository.fetchBookings() } catch (e: Exception) { emptyList() }
            val byId = runCatching { WalkerRepository.fetchWalkers() }
                .getOrDefault(emptyList()).associateBy { it.id }
            val pets = runCatching { PetRepository.list() }.getOrDefault(emptyList())
            val stats = runCatching { Network.api.ownerStats() }.getOrNull()
            val now = Instant.now()
            val future = bookings
                .filter { it.isActive }
                .mapNotNull { b -> runCatching { Instant.parse(b.startTime) }.getOrNull()?.let { b to it } }
                .filter { (_, start) -> !start.isBefore(now) }
                .sortedBy { (_, start) -> start }
            val upcoming = future.firstOrNull()?.let { (b, _) -> UpcomingWalk(b, byId[b.walkerId]) }
            val weekAhead = now.plus(Duration.ofDays(7))
            val weekCount = future.count { (_, start) -> !start.isAfter(weekAhead) }
            _state.value = HomeState(upcoming, weekCount, pets, stats)
        }
    }
}
