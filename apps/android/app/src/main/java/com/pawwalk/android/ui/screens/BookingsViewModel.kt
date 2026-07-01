package com.pawwalk.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pawwalk.android.data.Booking
import com.pawwalk.android.data.BookingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class BookingsViewModel : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Success(val bookings: List<Booking>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try {
                UiState.Success(BookingRepository.fetchBookings())
            } catch (e: Exception) {
                UiState.Error(e.message ?: "Something went wrong")
            }
        }
    }

    fun cancel(bookingId: String) {
        viewModelScope.launch {
            try {
                BookingRepository.cancelBooking(bookingId)
                load()
            } catch (e: Exception) {
                _state.value = UiState.Error(e.message ?: "Couldn't cancel booking")
            }
        }
    }
}
