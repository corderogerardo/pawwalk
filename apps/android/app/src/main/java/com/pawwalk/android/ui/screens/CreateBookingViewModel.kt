package com.pawwalk.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pawwalk.android.data.Booking
import com.pawwalk.android.data.BookingRepository
import com.pawwalk.android.data.CreateBookingRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class CreateBookingViewModel : ViewModel() {

    sealed interface UiState {
        data object Idle : UiState
        data object Loading : UiState
        data class Success(val booking: Booking) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Idle)
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun book(walkerId: String, dogName: String, startTime: String, durationMinutes: Int) {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try {
                val booking = BookingRepository.createBooking(
                    CreateBookingRequest(walkerId, dogName, startTime, durationMinutes)
                )
                UiState.Success(booking)
            } catch (e: Exception) {
                UiState.Error(e.message ?: "Couldn't create booking")
            }
        }
    }
}
