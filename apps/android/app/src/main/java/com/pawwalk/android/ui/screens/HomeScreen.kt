package com.pawwalk.android.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.data.Booking
import com.pawwalk.android.data.User
import com.pawwalk.android.data.Walker
import com.pawwalk.android.ui.components.ChatIcon
import com.pawwalk.android.ui.components.CheckIcon
import com.pawwalk.android.ui.components.CalendarIcon
import com.pawwalk.android.ui.components.ChevronRightIcon
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.HomeIcon
import com.pawwalk.android.ui.components.HudDot
import com.pawwalk.android.ui.components.LocationArrowIcon
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.components.PawIcon
import com.pawwalk.android.ui.components.PersonIcon
import com.pawwalk.android.ui.theme.BrandColors
import com.pawwalk.android.ui.theme.Hud
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val TIME_FMT = DateTimeFormatter.ofPattern("h:mm a").withZone(ZoneId.systemDefault())
private val DAY_FMT = DateTimeFormatter.ofPattern("EEE MMM d").withZone(ZoneId.systemDefault())

@Composable
fun HomeScreen(
    user: User?,
    onTrack: () -> Unit,
    onBook: () -> Unit = {},
    onProfile: () -> Unit = {},
    onAssistant: () -> Unit = {},
    onViewBookings: () -> Unit = {},
    viewModel: HomeViewModel = viewModel(),
) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()
    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .padding(horizontal = 20.dp)
                .padding(top = 10.dp, bottom = 104.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            StatusRow(c)
            DogHeader(c, user, state.pets.firstOrNull())
            Box(Modifier.fillMaxWidth().height(1.dp).background(c.ink.copy(alpha = 0.12f)))
            val up = state.upcoming
            if (up != null) NextWalkCard(c, up.booking, up.walker, onTrack, onAssistant)
            else EmptyWalkCard(c, onBook, onAssistant)
            StatsRow(c, state.weekCount)
            RecentWalks(c, onViewBookings)
        }
        HudTabBar(
            c, onTrack, onBook, onProfile,
            Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(16.dp)
        )
    }
}

@Composable
private fun StatusRow(c: BrandColors) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        HudDot(c.signalGreen)
        Spacer(Modifier.width(7.dp))
        MonoText("Tracking ready", c.ink.copy(alpha = 0.6f))
        Spacer(Modifier.weight(1f))
        MonoText("37.77°N · UTC−7", c.ink.copy(alpha = 0.38f), sizeSp = 9f, weight = FontWeight.Normal,
            trackingEm = 0.08f, upper = false)
    }
}

@Composable
private fun DogHeader(c: BrandColors, user: User?, pet: com.pawwalk.android.data.Pet?) {
    Row(Modifier.fillMaxWidth()) {
        Column(Modifier.weight(1f)) {
            MonoText("Dog · 001", c.accent)
            DmText(pet?.let { "${it.name}." } ?: "No pet yet.", c.ink, sizeSp = 40f, weight = FontWeight.Medium,
                trackingEm = -0.04f, modifier = Modifier.padding(top = 7.dp))
            DmText(pet?.subtitle?.ifEmpty { null } ?: "Add a pet in your profile", c.ink.copy(alpha = if (pet == null) 0.5f else 1f),
                sizeSp = 13.5f, weight = FontWeight.Medium, modifier = Modifier.padding(top = 9.dp))
            if (user != null) {
                MonoText("Owner · ${user.name}", c.ink.copy(alpha = 0.6f), sizeSp = 10f, weight = FontWeight.Normal,
                    trackingEm = 0.1f, modifier = Modifier.padding(top = 3.dp))
            }
        }
        PawBadge(c)
    }
}

@Composable
private fun PawBadge(c: BrandColors) {
    Box(Modifier.size(54.dp).border(1.5.dp, c.ink, RoundedCornerShape(16.dp))) {
        PawIcon(c.ink, size = 22.dp, modifier = Modifier.align(Alignment.Center))
        Box(Modifier.align(Alignment.TopEnd).padding(7.dp).size(5.dp)
            .background(c.accent, RoundedCornerShape(50)))
    }
}

@Composable
private fun NextWalkCard(c: BrandColors, booking: Booking, walker: Walker?, onTrack: () -> Unit, onChat: () -> Unit) {
    val on = c.onInverse
    val start = runCatching { Instant.parse(booking.startTime) }.getOrNull()
    val startLabel = start?.let { TIME_FMT.format(it) } ?: "—"
    val endLabel = start?.let { TIME_FMT.format(it.plusSeconds(booking.durationMinutes * 60L)) } ?: "—"
    val dayLabel = start?.let { DAY_FMT.format(it) } ?: ""
    val walkerName = walker?.name ?: "Your walker"
    val walkerMeta = listOfNotNull(
        walker?.let { "★ %.1f".format(it.rating) },
        walker?.neighborhoods?.take(2)?.joinToString(", "),
    ).filter { it.isNotBlank() }.joinToString(" · ")

    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(c.inverse)
            .padding(horizontal = 18.dp, vertical = 17.dp)
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            MonoText("Next walk", on.copy(alpha = 0.6f))
            Spacer(Modifier.weight(1f))
            Row(
                Modifier.border(1.dp, on.copy(alpha = 0.22f), RoundedCornerShape(50))
                    .padding(horizontal = 9.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(Modifier.size(5.dp).background(c.accent, RoundedCornerShape(50)))
                Spacer(Modifier.width(6.dp))
                MonoText(dayLabel, on, sizeSp = 9.5f, weight = FontWeight.Normal, trackingEm = 0.08f, upper = false)
            }
        }
        Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.padding(top = 13.dp)) {
            DmText(startLabel, on, sizeSp = 34f, weight = FontWeight.Medium, trackingEm = -0.04f)
            Spacer(Modifier.width(10.dp))
            MonoText("→ $endLabel", on.copy(alpha = 0.55f), sizeSp = 11f, weight = FontWeight.Normal,
                upper = false, modifier = Modifier.padding(bottom = 4.dp))
        }
        MonoText("${booking.durationMinutes} min · ${booking.dogName}", on.copy(alpha = 0.72f), sizeSp = 10f,
            weight = FontWeight.Normal, trackingEm = 0.09f, upper = false, modifier = Modifier.padding(top = 6.dp))

        Spacer(Modifier.height(14.dp))
        Box(Modifier.fillMaxWidth().height(1.dp).background(on.copy(alpha = 0.14f)))
        Spacer(Modifier.height(14.dp))

        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(38.dp).clip(RoundedCornerShape(50)).background(c.inverse2)
                .border(1.dp, on.copy(alpha = 0.22f), RoundedCornerShape(50)), Alignment.Center) {
                PersonIcon(on.copy(alpha = 0.5f), size = 16.dp)
            }
            Spacer(Modifier.width(11.dp))
            Column(Modifier.weight(1f)) {
                DmText(walkerName, on, sizeSp = 14f, weight = FontWeight.SemiBold)
                MonoText(walkerMeta, on.copy(alpha = 0.6f), sizeSp = 9f,
                    weight = FontWeight.Normal, trackingEm = 0.07f, upper = false)
            }
            Row(
                Modifier.clip(RoundedCornerShape(50)).background(c.signalGreen.copy(alpha = 0.18f))
                    .border(1.dp, c.signalGreen.copy(alpha = 0.5f), RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CheckIcon(c.signalGreenSoft, size = 8.dp)
                Spacer(Modifier.width(5.dp))
                MonoText("Vetted", c.signalGreenSoft, sizeSp = 8.5f, trackingEm = 0.08f)
            }
        }

        Row(Modifier.fillMaxWidth().padding(top = 15.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                Modifier.weight(1f).height(42.dp).clip(RoundedCornerShape(12.dp))
                    .background(c.accent).clickable { onTrack() },
                horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically
            ) {
                LocationArrowIcon(on, size = 12.dp)
                Spacer(Modifier.width(7.dp))
                DmText("Track live", on, sizeSp = 13f, weight = FontWeight.SemiBold)
            }
            Box(
                Modifier.size(46.dp, 42.dp).clip(RoundedCornerShape(12.dp))
                    .border(1.dp, on.copy(alpha = 0.22f), RoundedCornerShape(12.dp))
                    .clickable { onChat() },
                Alignment.Center
            ) { ChatIcon(on, size = 14.dp) }
        }
    }
}

@Composable
private fun EmptyWalkCard(c: BrandColors, onBook: () -> Unit, onChat: () -> Unit) {
    val on = c.onInverse
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(c.inverse)
            .padding(horizontal = 18.dp, vertical = 17.dp)
    ) {
        MonoText("Next walk", on.copy(alpha = 0.6f))
        DmText("No walks booked", on, sizeSp = 26f, weight = FontWeight.Medium, trackingEm = -0.03f,
            modifier = Modifier.padding(top = 10.dp))
        MonoText("Book a walker and your next walk shows up here.", on.copy(alpha = 0.66f), sizeSp = 10f,
            weight = FontWeight.Normal, trackingEm = 0.06f, upper = false, modifier = Modifier.padding(top = 6.dp))
        Row(Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                Modifier.weight(1f).height(42.dp).clip(RoundedCornerShape(12.dp))
                    .background(c.accent).clickable { onBook() },
                horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically
            ) {
                CalendarIcon(on, size = 12.dp)
                Spacer(Modifier.width(7.dp))
                DmText("Book a walk", on, sizeSp = 13f, weight = FontWeight.SemiBold)
            }
            Box(
                Modifier.size(46.dp, 42.dp).clip(RoundedCornerShape(12.dp))
                    .border(1.dp, on.copy(alpha = 0.22f), RoundedCornerShape(12.dp))
                    .clickable { onChat() },
                Alignment.Center
            ) { ChatIcon(on, size = 14.dp) }
        }
    }
}

@Composable
private fun StatsRow(c: BrandColors, weekCount: Int) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(9.dp)) {
        StatTile(c, "This week", "%02d".format(weekCount), "walks", (weekCount / 5f).coerceAtMost(1f), Modifier.weight(1f))
        StatTile(c, "Distance", "12.3", "km", 0.82f, Modifier.weight(1f))
        StatTile(c, "Streak", "09", "days", 0.75f, Modifier.weight(1f), accent = true)
    }
}

@Composable
private fun StatTile(
    c: BrandColors, label: String, value: String, unit: String, progress: Float,
    modifier: Modifier = Modifier, accent: Boolean = false,
) {
    val main = if (accent) c.accent else c.ink
    Column(
        modifier
            .clip(RoundedCornerShape(14.dp))
            .background(if (accent) c.accent.copy(alpha = 0.06f) else Color.Transparent)
            .border(1.dp, if (accent) c.accent.copy(alpha = 0.28f) else c.ink.copy(alpha = 0.12f),
                RoundedCornerShape(14.dp))
            .padding(horizontal = 12.dp, vertical = 11.dp)
    ) {
        MonoText(label, if (accent) c.accent else c.ink.copy(alpha = 0.55f), sizeSp = 8.5f, trackingEm = 0.1f)
        Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.padding(top = 5.dp)) {
            MonoText(value, main, sizeSp = 23f, weight = FontWeight.Normal, trackingEm = -0.03f, upper = false)
            Spacer(Modifier.width(3.dp))
            MonoText(unit, main.copy(alpha = if (accent) 0.6f else 0.4f), sizeSp = 9f,
                weight = FontWeight.Normal, upper = false, modifier = Modifier.padding(bottom = 2.dp))
        }
        Box(Modifier.padding(top = 9.dp).fillMaxWidth().height(3.dp).clip(RoundedCornerShape(2.dp))
            .background(main.copy(alpha = if (accent) 0.18f else 0.1f))) {
            Box(Modifier.fillMaxWidth(progress).height(3.dp)
                .background(if (accent) c.accent else c.inverse))
        }
    }
}

@Composable
private fun RecentWalks(c: BrandColors, onViewAll: () -> Unit) {
    Column(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth().padding(bottom = 2.dp), verticalAlignment = Alignment.CenterVertically) {
            MonoText("§ Recent walks", c.ink.copy(alpha = 0.6f), trackingEm = 0.1f)
            Spacer(Modifier.weight(1f))
            MonoText("View all", c.accent, sizeSp = 9f, weight = FontWeight.Normal, trackingEm = 0.08f,
                modifier = Modifier.clickable { onViewAll() })
        }
        RecentWalkRow(c, listOf(22f, 11f, 16f, 6f, 13f, 5f), "Riverside loop", "Sat · 45 min · 2.6 km · Elena V.")
        RecentWalkRow(c, listOf(8f, 18f, 10f, 20f, 9f, 15f), "Dunes & pier", "Thu · 30 min · 1.8 km · Marcus T.")
    }
}

@Composable
private fun RecentWalkRow(c: BrandColors, points: List<Float>, title: String, meta: String) {
    Column {
        Box(Modifier.fillMaxWidth().height(1.dp).background(c.ink.copy(alpha = 0.12f)))
        Row(Modifier.fillMaxWidth().padding(vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
            Sparkline(c, points, Modifier.size(42.dp, 28.dp))
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                DmText(title, c.ink, sizeSp = 13f, weight = FontWeight.SemiBold)
                MonoText(meta, c.ink.copy(alpha = 0.6f), sizeSp = 9f, weight = FontWeight.Normal, trackingEm = 0.07f)
            }
            ChevronRightIcon(c.ink.copy(alpha = 0.35f), size = 16.dp)
        }
    }
}

@Composable
private fun Sparkline(c: BrandColors, points: List<Float>, modifier: Modifier) {
    Canvas(modifier) {
        val w = size.width; val h = size.height
        val n = points.size
        fun px(i: Int) = (2f + 38f * i / (n - 1)) / 42f * w
        fun py(v: Float) = v / 28f * h
        val path = androidx.compose.ui.graphics.Path().apply {
            moveTo(px(0), py(points[0]))
            for (i in 1 until n) lineTo(px(i), py(points[i]))
        }
        drawPath(path, c.ink, style = Stroke(width = 1.4.dp.toPx(), cap = StrokeCap.Round))
        drawCircle(c.accent, 2.2.dp.toPx(), Offset(px(n - 1), py(points.last())))
    }
}

@Composable
private fun HudTabBar(
    c: BrandColors, onTrack: () -> Unit, onBook: () -> Unit, onProfile: () -> Unit, modifier: Modifier = Modifier,
) {
    val on = c.onInverse
    Row(
        modifier.clip(RoundedCornerShape(50)).background(c.inverse).padding(6.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Tab("Home", active = true) { HomeIcon(on, 15.dp) }
        Tab("Book", onClick = onBook) { CalendarIcon(on.copy(alpha = 0.6f), 15.dp) }
        Tab("Track", onClick = onTrack) { LocationArrowIcon(on.copy(alpha = 0.6f), 15.dp) }
        Tab("Mochi", onClick = onProfile) { PawIcon(on.copy(alpha = 0.6f), 15.dp) }
    }
}

@Composable
private fun RowScope.Tab(
    label: String, active: Boolean = false, onClick: () -> Unit = {}, icon: @Composable () -> Unit,
) {
    val c = Hud.colors
    val on = c.onInverse
    Column(
        Modifier.weight(1f).clip(RoundedCornerShape(50))
            .background(if (active) c.accent else Color.Transparent)
            .clickable { onClick() }.padding(vertical = 9.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        icon()
        Spacer(Modifier.height(3.dp))
        MonoText(label, if (active) on else on.copy(alpha = 0.6f), sizeSp = 8.5f, trackingEm = 0.08f)
    }
}
