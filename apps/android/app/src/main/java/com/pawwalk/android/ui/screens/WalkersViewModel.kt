package com.pawwalk.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pawwalk.android.data.Walker
import com.pawwalk.android.data.WalkerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class WalkersViewModel : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Success(val walkers: List<Walker>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try {
                UiState.Success(WalkerRepository.fetchWalkers())
            } catch (e: Exception) {
                UiState.Error(e.message ?: "Something went wrong")
            }
        }
    }
}
