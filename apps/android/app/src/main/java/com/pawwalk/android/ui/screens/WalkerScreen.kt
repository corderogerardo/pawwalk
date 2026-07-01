package com.pawwalk.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.data.Booking
import com.pawwalk.android.data.BookingRepository
import com.pawwalk.android.data.Walker
import com.pawwalk.android.data.WalkerProfileUpdate
import com.pawwalk.android.data.WalkerRepository
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.theme.BrandColors
import com.pawwalk.android.ui.theme.Hud
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val WALK_FMT = DateTimeFormatter.ofPattern("EEE, MMM d 'at' h:mm a").withZone(ZoneId.systemDefault())

class WalkerViewModel : ViewModel() {
    data class State(
        val bookings: List<Booking> = emptyList(),
        val profile: Walker? = null,
        val loading: Boolean = true,
        val error: String? = null,
    )

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true)
            val profile = runCatching { WalkerRepository.myProfile() }.getOrNull()
            val bookings = runCatching { BookingRepository.assignedBookings() }.getOrNull()
            _state.value = if (bookings != null) {
                State(bookings.sortedBy { it.startTime }, profile, false, null)
            } else {
                State(emptyList(), profile, false, "Couldn't load your walks. Pull to refresh.")
            }
        }
    }

    fun act(id: String, action: String) {
        viewModelScope.launch { runCatching { BookingRepository.transition(id, action) }; load() }
    }

    fun updateProfile(update: WalkerProfileUpdate) {
        viewModelScope.launch {
            runCatching { WalkerRepository.updateProfile(update) }.getOrNull()?.let {
                _state.value = _state.value.copy(profile = it)
            }
        }
    }
}

@Composable
fun WalkerScreen(walkerName: String, onLogout: () -> Unit, viewModel: WalkerViewModel = viewModel()) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()
    var showEdit by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(Modifier.fillMaxSize().statusBarsPadding().padding(horizontal = 20.dp).padding(top = 12.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                MonoText("PawWalk · Walker", c.accent)
                Spacer(Modifier.weight(1f))
                MonoText("Edit", c.ink.copy(alpha = 0.6f), modifier = Modifier.clickable { showEdit = true })
                Spacer(Modifier.width(14.dp))
                MonoText("Log out", Color(0xFFC0392B), modifier = Modifier.clickable { onLogout() })
            }
            DmText(walkerName, c.ink, sizeSp = 28f, weight = FontWeight.Medium, trackingEm = -0.03f,
                modifier = Modifier.padding(top = 12.dp))
            state.profile?.let { p ->
                MonoText("$${p.pricePer30MinCents / 100}/30 min · ★ %.1f".format(p.rating),
                    c.ink.copy(alpha = 0.6f), sizeSp = 10f, weight = FontWeight.Normal, upper = false,
                    modifier = Modifier.padding(top = 4.dp))
                if (p.neighborhoods.isNotEmpty()) {
                    MonoText(p.neighborhoods.joinToString(" · "), c.ink.copy(alpha = 0.5f), sizeSp = 9f,
                        weight = FontWeight.Normal, upper = false, modifier = Modifier.padding(top = 2.dp))
                }
            }
            Spacer(Modifier.height(16.dp))
            MonoText("§ Assigned walks", c.ink.copy(alpha = 0.6f), trackingEm = 0.1f)
            Spacer(Modifier.height(10.dp))

            when {
                state.loading ->
                    Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(color = c.accent) }
                state.error != null ->
                    Box(Modifier.fillMaxSize(), Alignment.Center) { MonoText(state.error!!, c.ink.copy(alpha = 0.6f), upper = false) }
                state.bookings.isEmpty() ->
                    Box(Modifier.fillMaxSize(), Alignment.Center) {
                        MonoText("No walks yet. Owners book you from your profile.", c.ink.copy(alpha = 0.5f), upper = false)
                    }
                else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(state.bookings, key = { it.id }) { b ->
                        WalkCard(c, b) { action -> viewModel.act(b.id, action) }
                    }
                }
            }
        }
    }

    if (showEdit) {
        EditProfileDialog(state.profile, onDismiss = { showEdit = false }) { update ->
            viewModel.updateProfile(update); showEdit = false
        }
    }
}

@Composable
private fun WalkCard(c: BrandColors, booking: Booking, onAction: (String) -> Unit) {
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
            .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(16.dp)).padding(16.dp)
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            DmText(booking.dogName, c.ink, sizeSp = 15f, weight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            StatusPill(c, booking.status)
        }
        MonoText(WALK_FMT.format(Instant.parse(booking.startTime)), c.ink.copy(alpha = 0.6f), sizeSp = 9.5f,
            weight = FontWeight.Normal, upper = false, modifier = Modifier.padding(top = 8.dp))
        MonoText("${booking.durationMinutes} min · $${booking.priceCents / 100}", c.ink.copy(alpha = 0.6f),
            sizeSp = 9.5f, weight = FontWeight.Normal, upper = false, modifier = Modifier.padding(top = 3.dp))

        val actions: List<Pair<String, String>> = when (booking.status) {
            "pending" -> listOf("Accept" to "accept", "Decline" to "decline")
            "confirmed" -> listOf("Start walk" to "start")
            "in_progress" -> listOf("Complete" to "complete")
            else -> emptyList()
        }
        if (actions.isNotEmpty()) {
            Row(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                actions.forEachIndexed { i, (label, action) ->
                    val filled = i == 0
                    Box(
                        Modifier.height(34.dp).clip(RoundedCornerShape(9.dp))
                            .background(if (filled) c.accent else Color.Transparent)
                            .border(1.dp, if (filled) Color.Transparent else c.ink.copy(alpha = 0.25f), RoundedCornerShape(9.dp))
                            .clickable { onAction(action) }.padding(horizontal = 14.dp),
                        contentAlignment = Alignment.Center,
                    ) { DmText(label, if (filled) c.onInverse else c.ink, sizeSp = 12f, weight = FontWeight.SemiBold) }
                }
            }
        }
    }
}

@Composable
private fun StatusPill(c: BrandColors, status: String) {
    val color = when (status) {
        "completed" -> c.accent
        "cancelled" -> Color(0xFFC0392B)
        "confirmed", "in_progress" -> c.signalGreen
        else -> c.pinAmber
    }
    Box(
        Modifier.clip(RoundedCornerShape(50)).border(1.dp, color.copy(alpha = 0.5f), RoundedCornerShape(50))
            .padding(horizontal = 9.dp, vertical = 4.dp)
    ) { MonoText(status.replace('_', ' '), color, sizeSp = 8.5f, trackingEm = 0.06f) }
}

@Composable
private fun EditProfileDialog(profile: Walker?, onDismiss: () -> Unit, onSave: (WalkerProfileUpdate) -> Unit) {
    val c = Hud.colors
    var bio by remember { mutableStateOf(profile?.bio ?: "") }
    var price by remember { mutableStateOf(profile?.let { (it.pricePer30MinCents / 100).toString() } ?: "") }
    var hoods by remember { mutableStateOf(profile?.neighborhoods?.joinToString(", ") ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { DmText("Edit profile", c.ink, sizeSp = 18f, weight = FontWeight.SemiBold) },
        text = {
            Column {
                OutlinedTextField(bio, { bio = it }, label = { DmText("Bio", c.ink.copy(alpha = 0.6f), 13f) })
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(price, { price = it }, label = { DmText("Price / 30 min ($)", c.ink.copy(alpha = 0.6f), 13f) },
                    singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(hoods, { hoods = it }, label = { DmText("Neighborhoods (comma-sep)", c.ink.copy(alpha = 0.6f), 13f) })
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val list = hoods.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                onSave(WalkerProfileUpdate(bio, price.toIntOrNull()?.times(100), list))
            }) { DmText("Save", c.accent, 14f, weight = FontWeight.SemiBold) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { DmText("Cancel", c.ink.copy(alpha = 0.6f), 14f) } },
    )
}
