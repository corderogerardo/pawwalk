package com.pawwalk.android.data

/**
 * Wraps the auth endpoints + token persistence. Unlike WalkerRepository there's
 * no sample-data fallback here — if the backend is unreachable, signup/login
 * should fail loudly rather than pretend you're signed in.
 */
object AuthRepository {
    private val api: PawWalkApi get() = Network.api

    val isSignedIn: Boolean get() = TokenStore.getToken() != null

    suspend fun signup(email: String, password: String, name: String): User {
        val response = api.signup(SignupRequest(email, password, name))
        TokenStore.saveToken(response.accessToken)
        return response.user
    }

    suspend fun login(email: String, password: String): User {
        val response = api.login(LoginRequest(email, password))
        TokenStore.saveToken(response.accessToken)
        return response.user
    }

    /** Validates the saved token against the backend and returns the current user, or null if there isn't one / it's no longer valid. */
    suspend fun me(): User? {
        if (TokenStore.getToken() == null) return null
        return try {
            api.me()
        } catch (e: Exception) {
            null
        }
    }

    fun logout() = TokenStore.clear()
}
