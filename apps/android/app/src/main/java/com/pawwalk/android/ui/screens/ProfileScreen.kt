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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pawwalk.android.data.Pet
import com.pawwalk.android.data.PetRepository
import com.pawwalk.android.data.User
import com.pawwalk.android.ui.components.CalendarIcon
import com.pawwalk.android.ui.components.ChevronRightIcon
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.LogoutIcon
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.components.PawIcon
import com.pawwalk.android.ui.theme.BrandColors
import com.pawwalk.android.ui.theme.Hud
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val JOINED_FMT = DateTimeFormatter.ofPattern("MMM yyyy").withZone(ZoneId.systemDefault())

/**
 * Account / dog screen — destination for the "Mochi" tab (see
 * docs/FUNCTIONAL-REVIEW.md N2). Shows the signed-in user, the dog, a way into
 * bookings, and the relocated logout action. Mirrors the iOS ProfileView.
 */
@Composable
fun ProfileScreen(
    user: User?,
    onClose: () -> Unit,
    onBookings: () -> Unit,
    onPets: () -> Unit,
    onLogout: () -> Unit,
) {
    val c = Hud.colors
    var pets by remember { mutableStateOf<List<Pet>>(emptyList()) }
    LaunchedEffect(Unit) { pets = runCatching { PetRepository.list() }.getOrDefault(emptyList()) }
    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState())
                .statusBarsPadding().padding(horizontal = 24.dp).padding(top = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                MonoText("PawWalk · Account", c.accent)
                Spacer(Modifier.weight(1f))
                MonoText("Close", c.ink.copy(alpha = 0.5f), sizeSp = 9f, weight = FontWeight.Normal,
                    modifier = Modifier.clickable { onClose() })
            }
            Column {
                DmText(user?.name ?: "Guest", c.ink, sizeSp = 34f, weight = FontWeight.Medium, trackingEm = -0.03f)
                user?.email?.let {
                    MonoText(it, c.ink.copy(alpha = 0.6f), sizeSp = 10f, weight = FontWeight.Normal,
                        trackingEm = 0.06f, upper = false, modifier = Modifier.padding(top = 6.dp))
                }
                user?.createdAt?.let { iso ->
                    val joined = runCatching { JOINED_FMT.format(Instant.parse(iso)) }.getOrNull()
                    if (joined != null) {
                        MonoText("Member since $joined", c.ink.copy(alpha = 0.45f), sizeSp = 9f,
                            weight = FontWeight.Normal, trackingEm = 0.08f, upper = false,
                            modifier = Modifier.padding(top = 3.dp))
                    }
                }
            }
            Box(Modifier.fillMaxWidth().height(1.dp).background(c.ink.copy(alpha = 0.12f)))

            PetsSection(c, pets, onPets)
            PetsRow(c, onPets)
            BookingsRow(c, onBookings)
            Spacer(Modifier.height(4.dp))
            LogoutButton(c, onLogout)
        }
    }
}

@Composable
private fun PetsSection(c: BrandColors, pets: List<Pet>, onPets: () -> Unit) {
    if (pets.isEmpty()) {
        Row(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
                .clickable { onPets() }.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            PawIcon(c.ink, size = 18.dp)
            Spacer(Modifier.width(10.dp))
            DmText("Add your first pet", c.ink, sizeSp = 14f, weight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            MonoText("+", c.accent, sizeSp = 16f, upper = false)
        }
    } else {
        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(16.dp)).padding(horizontal = 16.dp, vertical = 4.dp)
        ) {
            pets.forEach { pet ->
                Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(40.dp).border(1.5.dp, c.ink, RoundedCornerShape(12.dp)), Alignment.Center) {
                        PawIcon(c.ink, size = 18.dp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        DmText(pet.name, c.ink, sizeSp = 15f, weight = FontWeight.SemiBold)
                        if (pet.subtitle.isNotEmpty()) {
                            MonoText(pet.subtitle, c.ink.copy(alpha = 0.6f), sizeSp = 9f,
                                weight = FontWeight.Normal, trackingEm = 0.06f)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PetsRow(c: BrandColors, onPets: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().height(52.dp).clip(RoundedCornerShape(14.dp))
            .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(14.dp))
            .clickable { onPets() }.padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        PawIcon(c.ink, size = 16.dp)
        Spacer(Modifier.width(10.dp))
        DmText("Manage pets", c.ink, sizeSp = 14f, weight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        ChevronRightIcon(c.ink.copy(alpha = 0.35f), size = 14.dp)
    }
}

@Composable
private fun BookingsRow(c: BrandColors, onBookings: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().height(52.dp).clip(RoundedCornerShape(14.dp))
            .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(14.dp))
            .clickable { onBookings() }.padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CalendarIcon(c.ink, size = 16.dp)
        Spacer(Modifier.width(10.dp))
        DmText("Your bookings", c.ink, sizeSp = 14f, weight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        ChevronRightIcon(c.ink.copy(alpha = 0.35f), size = 14.dp)
    }
}

@Composable
private fun LogoutButton(c: BrandColors, onLogout: () -> Unit) {
    val red = androidx.compose.ui.graphics.Color(0xFFC0392B)
    Row(
        Modifier.fillMaxWidth().height(46.dp).clip(RoundedCornerShape(12.dp))
            .border(1.dp, red.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
            .clickable { onLogout() },
        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
    ) {
        LogoutIcon(red, size = 15.dp)
        Spacer(Modifier.width(8.dp))
        DmText("Log out", red, sizeSp = 14f, weight = FontWeight.SemiBold)
    }
}
