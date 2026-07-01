package com.pawwalk.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pawwalk.android.data.AuthRepository
import com.pawwalk.android.data.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AuthViewModel : ViewModel() {

    sealed interface UiState {
        data object Idle : UiState
        data object Loading : UiState
        data class Error(val message: String) : UiState
        data class Success(val user: User) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Idle)
    val state: StateFlow<UiState> = _state.asStateFlow()

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    val signedIn: StateFlow<Boolean> get() = _signedIn
    private val _signedIn = MutableStateFlow(false)

    /** Checks for a saved token on launch. Call once, from MainActivity. */
    fun restoreSession() {
        viewModelScope.launch {
            val user = AuthRepository.me()
            _currentUser.value = user
            _signedIn.value = user != null
        }
    }

    fun signup(email: String, password: String, name: String, role: String) = runAuthCall {
        AuthRepository.signup(email, password, name, role)
    }

    fun login(email: String, password: String) = runAuthCall {
        AuthRepository.login(email, password)
    }

    fun logout() {
        AuthRepository.logout()
        _currentUser.value = null
        _signedIn.value = false
        _state.value = UiState.Idle
    }

    private fun runAuthCall(block: suspend () -> User) {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try {
                val user = block()
                _currentUser.value = user
                _signedIn.value = true
                UiState.Success(user)
            } catch (e: Exception) {
                UiState.Error(e.toUserMessage())
            }
        }
    }

    private fun Exception.toUserMessage(): String = when {
        this is HttpException && code() == 401 -> "Incorrect email or password"
        this is HttpException && code() == 409 -> "An account with that email already exists"
        else -> message ?: "Something went wrong"
    }
}
