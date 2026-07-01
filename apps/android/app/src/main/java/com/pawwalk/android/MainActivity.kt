package com.pawwalk.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.data.Booking
import com.pawwalk.android.data.TokenStore
import com.pawwalk.android.data.Walker
import com.pawwalk.android.ui.screens.AssistantScreen
import com.pawwalk.android.ui.screens.AuthScreen
import com.pawwalk.android.ui.screens.AuthViewModel
import com.pawwalk.android.ui.screens.BookingsScreen
import com.pawwalk.android.ui.screens.CreateBookingScreen
import com.pawwalk.android.ui.screens.HomeScreen
import com.pawwalk.android.ui.screens.LiveScreen
import com.pawwalk.android.ui.screens.PetsScreen
import com.pawwalk.android.ui.screens.ProfileScreen
import com.pawwalk.android.ui.screens.WalkerScreen
import com.pawwalk.android.ui.screens.WalkersScreen
import com.pawwalk.android.ui.theme.Hud
import com.pawwalk.android.ui.theme.PawWalkTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        TokenStore.init(this) // must happen before anything touches Network (auth interceptor reads it)
        enableEdgeToEdge()
        setContent {
            PawWalkTheme {
                Surface(Modifier.fillMaxSize(), color = Hud.colors.canvas) {
                    val authViewModel: AuthViewModel = viewModel()
                    val signedIn by authViewModel.signedIn.collectAsState()
                    val currentUser by authViewModel.currentUser.collectAsState()
                    var checkedSession by remember { mutableStateOf(false) }

                    if (!checkedSession) {
                        // Restore a saved token on launch — checkedSession flips once the
                        // backend confirms it's still valid (or there wasn't one).
                        LaunchedEffect(Unit) {
                            authViewModel.restoreSession()
                            checkedSession = true
                        }
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Hud.colors.accent)
                        }
                    } else if (!signedIn) {
                        AuthScreen(authViewModel)
                    } else if (currentUser?.role == "walker") {
                        // The walker streams GPS for a walk that's underway.
                        var liveWalk by remember { mutableStateOf<Booking?>(null) }
                        val walk = liveWalk
                        if (walk != null) {
                            LiveScreen(
                                onClose = { liveWalk = null },
                                bookingId = walk.id,
                                dogName = walk.dogName,
                            )
                        } else {
                            WalkerScreen(
                                walkerName = currentUser?.name ?: "Walker",
                                onLogout = { authViewModel.logout() },
                                onTrack = { liveWalk = it },
                            )
                        }
                    } else {
                        // ponytail: state-based nav instead of Navigation Compose — one screen
                        // stack is plenty for this flow, add a real nav graph if it grows.
                        var screen by remember { mutableStateOf<Screen>(Screen.Home) }
                        Crossfade(targetState = screen, label = "screen") { current ->
                            when (current) {
                                is Screen.Home -> HomeScreen(
                                    user = currentUser,
                                    onTrack = { dog -> screen = Screen.Live(dog) },
                                    onBook = { screen = Screen.Walkers },
                                    onProfile = { screen = Screen.Profile },
                                    onAssistant = { screen = Screen.Assistant },
                                    onViewBookings = { screen = Screen.Bookings },
                                )
                                is Screen.Live -> LiveScreen(
                                    onClose = { screen = Screen.Home },
                                    dogName = current.dogName,
                                )
                                is Screen.Walkers -> WalkersScreen(
                                    onWalkerSelected = { walker -> screen = Screen.CreateBooking(walker) },
                                )
                                is Screen.CreateBooking -> CreateBookingScreen(
                                    walker = current.walker,
                                    onClose = { screen = Screen.Walkers },
                                    onBooked = { screen = Screen.Bookings },
                                )
                                is Screen.Bookings -> BookingsScreen(onClose = { screen = Screen.Home })
                                is Screen.Profile -> ProfileScreen(
                                    user = currentUser,
                                    onClose = { screen = Screen.Home },
                                    onBookings = { screen = Screen.Bookings },
                                    onPets = { screen = Screen.Pets },
                                    onLogout = { authViewModel.logout() },
                                )
                                is Screen.Pets -> PetsScreen(onClose = { screen = Screen.Profile })
                                is Screen.Assistant -> AssistantScreen(
                                    onClose = { screen = Screen.Home },
                                    onBook = { walker -> screen = Screen.CreateBooking(walker) },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/** The post-login screen stack. A sealed interface keeps Crossfade's targetState typed and lets CreateBooking carry its walker. */
private sealed interface Screen {
    data object Home : Screen
    data class Live(val dogName: String? = null) : Screen
    data object Walkers : Screen
    data class CreateBooking(val walker: Walker) : Screen
    data object Bookings : Screen
    data object Profile : Screen
    data object Pets : Screen
    data object Assistant : Screen
}
