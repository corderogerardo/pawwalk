package com.pawwalk.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.data.Booking
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.theme.BrandColors
import com.pawwalk.android.ui.theme.Hud
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

private val START_TIME_FORMAT = DateTimeFormatter.ofPattern("EEE, MMM d 'at' h:mm a").withZone(ZoneOffset.systemDefault())

@Composable
fun BookingsScreen(onClose: () -> Unit, viewModel: BookingsViewModel = viewModel()) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()

    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(Modifier.fillMaxSize().statusBarsPadding().padding(horizontal = 20.dp).padding(top = 10.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                MonoText("← Back", c.ink.copy(alpha = 0.6f), modifier = Modifier.clickable { onClose() })
            }
            DmText("Your bookings.", c.ink, sizeSp = 28f, weight = FontWeight.Medium, trackingEm = -0.03f,
                modifier = Modifier.padding(top = 14.dp, bottom = 18.dp))

            when (val s = state) {
                is BookingsViewModel.UiState.Loading ->
                    Column(
                        Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) { CircularProgressIndicator(color = c.accent) }

                is BookingsViewModel.UiState.Error ->
                    Column(
                        Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) { MonoText("Couldn't load bookings: ${s.message}", c.ink.copy(alpha = 0.6f), upper = false) }

                is BookingsViewModel.UiState.Success ->
                    if (s.bookings.isEmpty()) {
                        Column(
                            Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) { MonoText("No bookings yet", c.ink.copy(alpha = 0.5f), upper = false) }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            items(s.bookings, key = { it.id }) { booking ->
                                BookingCard(
                                    c, booking,
                                    onCancel = { viewModel.cancel(booking.id) },
                                )
                            }
                        }
                    }
            }
        }
    }
}

@Composable
private fun BookingCard(c: BrandColors, booking: Booking, onCancel: () -> Unit) {
    val cancellable = booking.status == "pending" || booking.status == "confirmed"
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(c.canvasDeep.copy(alpha = 0.4f))
            .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            DmText(booking.dogName, c.ink, sizeSp = 15f, weight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            StatusPill(c, booking.status)
        }
        MonoText(
            START_TIME_FORMAT.format(Instant.parse(booking.startTime)),
            c.ink.copy(alpha = 0.6f), sizeSp = 9.5f, weight = FontWeight.Normal, trackingEm = 0.06f, upper = false,
            modifier = Modifier.padding(top = 8.dp),
        )
        MonoText(
            "${booking.durationMinutes} min · $%.2f".format(booking.priceCents / 100.0),
            c.ink.copy(alpha = 0.6f), sizeSp = 9.5f, weight = FontWeight.Normal, trackingEm = 0.06f, upper = false,
            modifier = Modifier.padding(top = 3.dp),
        )
        if (cancellable) {
            Row(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    Modifier.clip(RoundedCornerShape(10.dp))
                        .border(1.dp, c.ink.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                        .clickable { onCancel() }
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    MonoText("Cancel", c.ink.copy(alpha = 0.7f), sizeSp = 9f, trackingEm = 0.08f)
                }
            }
        }
    }
}

@Composable
private fun StatusPill(c: BrandColors, status: String) {
    val color = when (status) {
        "completed" -> c.signalGreen
        "cancelled" -> Color(0xFFC0392B)
        "in_progress" -> c.pinBlue
        else -> c.accent
    }
    Row(
        Modifier.clip(RoundedCornerShape(50)).background(color.copy(alpha = 0.16f))
            .border(1.dp, color.copy(alpha = 0.5f), RoundedCornerShape(50))
            .padding(horizontal = 9.dp, vertical = 4.dp)
    ) {
        MonoText(status.replace('_', ' '), color, sizeSp = 8.5f, trackingEm = 0.08f)
    }
}
