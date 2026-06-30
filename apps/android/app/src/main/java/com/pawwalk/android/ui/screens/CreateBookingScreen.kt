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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.pawwalk.android.data.Walker
import com.pawwalk.android.ui.components.ChevronRightIcon
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.theme.DMSans
import com.pawwalk.android.ui.theme.Hud
import java.time.Instant
import java.time.LocalTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

private val DURATIONS = listOf(30, 45, 60)

/**
 * Small booking-creation form shown after tapping a walker. Start time is
 * kept simple — pick an hour later today — rather than pulling in a date/time
 * picker dependency for one field.
 */
@Composable
fun CreateBookingScreen(
    walker: Walker,
    onClose: () -> Unit,
    onBooked: () -> Unit,
    viewModel: CreateBookingViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()

    var dogName by remember { mutableStateOf("") }
    var duration by remember { mutableStateOf(30) }
    var hoursFromNow by remember { mutableStateOf(2) }
    var validationError by remember { mutableStateOf<String?>(null) }

    val loading = state is CreateBookingViewModel.UiState.Loading
    val serverError = (state as? CreateBookingViewModel.UiState.Error)?.message

    LaunchedEffect(state) {
        if (state is CreateBookingViewModel.UiState.Success) onBooked()
    }

    val startTime = remember(hoursFromNow) {
        Instant.now().plusSeconds(hoursFromNow * 3600L).truncatedTo(java.time.temporal.ChronoUnit.MINUTES)
    }
    val startLabel = remember(startTime) {
        DateTimeFormatter.ofPattern("EEE, MMM d 'at' h:mm a").withZone(ZoneOffset.systemDefault()).format(startTime)
    }

    fun submit() {
        validationError = if (dogName.isBlank()) "Enter your dog's name" else null
        if (validationError != null) return
        viewModel.book(walker.id, dogName.trim(), startTime.toString(), duration)
    }

    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .imePadding()
                .padding(horizontal = 24.dp)
                .padding(top = 24.dp, bottom = 32.dp),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                MonoText("← Back", c.ink.copy(alpha = 0.6f), modifier = Modifier.clickable { onClose() })
            }
            DmText("Book ${walker.name}.", c.ink, sizeSp = 28f, weight = FontWeight.Medium, trackingEm = -0.03f,
                modifier = Modifier.padding(top = 18.dp))
            MonoText(walker.priceLabel, c.accent, sizeSp = 10.5f, weight = FontWeight.Normal,
                trackingEm = 0.08f, modifier = Modifier.padding(top = 6.dp), upper = false)

            Spacer(Modifier.height(28.dp))

            MonoText("Dog's name", c.ink.copy(alpha = 0.55f), sizeSp = 9.5f, trackingEm = 0.1f)
            OutlinedTextField(
                value = dogName,
                onValueChange = { dogName = it },
                modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
                singleLine = true,
                textStyle = TextStyle(fontFamily = DMSans, color = c.ink),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = c.accent,
                    unfocusedBorderColor = c.ink.copy(alpha = 0.18f),
                    cursorColor = c.accent,
                    focusedContainerColor = c.canvasDeep.copy(alpha = 0.4f),
                    unfocusedContainerColor = c.canvasDeep.copy(alpha = 0.4f),
                ),
            )

            Spacer(Modifier.height(20.dp))

            MonoText("Duration", c.ink.copy(alpha = 0.55f), sizeSp = 9.5f, trackingEm = 0.1f)
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DURATIONS.forEach { mins ->
                    val selected = mins == duration
                    Row(
                        Modifier.weight(1f).height(42.dp).clip(RoundedCornerShape(12.dp))
                            .background(if (selected) c.accent else Color.Transparent)
                            .border(1.dp, if (selected) c.accent else c.ink.copy(alpha = 0.18f), RoundedCornerShape(12.dp))
                            .clickable { duration = mins },
                        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
                    ) {
                        DmText("$mins min", if (selected) c.onInverse else c.ink, sizeSp = 13f, weight = FontWeight.SemiBold)
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            MonoText("Start time", c.ink.copy(alpha = 0.55f), sizeSp = 9.5f, trackingEm = 0.1f)
            Row(
                Modifier.fillMaxWidth().padding(top = 8.dp).clip(RoundedCornerShape(12.dp))
                    .background(c.canvasDeep.copy(alpha = 0.4f))
                    .border(1.dp, c.ink.copy(alpha = 0.18f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                DmText(startLabel, c.ink, sizeSp = 13f, weight = FontWeight.Medium, modifier = Modifier.weight(1f))
                MonoText("−", c.ink.copy(alpha = 0.6f), sizeSp = 14f, weight = FontWeight.SemiBold,
                    modifier = Modifier.clickable(enabled = hoursFromNow > 1) { hoursFromNow-- }.padding(8.dp))
                Spacer(Modifier.width(4.dp))
                MonoText("+", c.ink.copy(alpha = 0.6f), sizeSp = 14f, weight = FontWeight.SemiBold,
                    modifier = Modifier.clickable { hoursFromNow++ }.padding(8.dp))
            }

            val errorText = validationError ?: serverError
            if (errorText != null) {
                MonoText(errorText, Color(0xFFC0392B), sizeSp = 10f, weight = FontWeight.Normal,
                    trackingEm = 0.04f, upper = false, modifier = Modifier.padding(top = 14.dp))
            }

            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(top = 26.dp)
                    .height(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(c.accent)
                    .clickable(enabled = !loading) { submit() },
                horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
            ) {
                if (loading) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = c.onInverse, strokeWidth = 2.dp)
                } else {
                    DmText("Confirm booking", c.onInverse, sizeSp = 14f, weight = FontWeight.SemiBold)
                    Spacer(Modifier.width(6.dp))
                    ChevronRightIcon(c.onInverse, size = 14.dp)
                }
            }
        }
    }
}
