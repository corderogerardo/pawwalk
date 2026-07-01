package com.pawwalk.android.ui.screens

import android.Manifest
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.ExpandIcon
import com.pawwalk.android.ui.components.HudDot
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.components.PawIcon
import com.pawwalk.android.ui.theme.Hud
import com.pawwalk.android.ui.theme.JetBrainsMono
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min

/** PawWalk — Live GPS Tracking (hero). The HUD is now driven by real GPS streamed
 *  over a WebSocket (docs/FUNCTIONAL-REVIEW.md N7). No map tiles = no map cost. */
@Composable
fun LiveScreen(
    onClose: () -> Unit,
    bookingId: String? = null,
    dogName: String? = null,
    viewModel: LiveViewModel = viewModel(),
) {
    val dogLabel = dogName ?: "Your dog"
    BackHandler { onClose() }
    val c = Hud.colors
    val on = c.onInverse
    val measurer = rememberTextMeasurer()
    val state by viewModel.state.collectAsState()

    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        if (grants.values.any { it }) viewModel.startLocationUpdates() else viewModel.onPermissionDenied()
    }
    LaunchedEffect(Unit) {
        viewModel.connect(bookingId)
        permLauncher.launch(
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        )
    }

    // Wall-clock tick so the Elapsed readout advances every second.
    var nowMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) { while (true) { nowMs = System.currentTimeMillis(); delay(1000) } }

    val inf = rememberInfiniteTransition(label = "live")
    val ping by inf.animateFloat(0f, 1f,
        infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Restart), label = "ping")

    Box(Modifier.fillMaxSize().background(c.inverse)) {
        Canvas(Modifier.fillMaxSize()) {
            // Static grid backdrop.
            val step = size.width / 10f
            var gx = 0f
            while (gx <= size.width) { drawLine(on.copy(alpha = 0.05f), Offset(gx, 0f), Offset(gx, size.height), 1f); gx += step }
            var gy = 0f
            while (gy <= size.height) { drawLine(on.copy(alpha = 0.05f), Offset(0f, gy), Offset(size.width, gy), 1f); gy += step }

            val fixes = state.fixes
            if (fixes.isEmpty()) return@Canvas

            // Equirectangular projection (equal aspect), centered in a padded rect.
            val midLat = (fixes.minOf { it.lat } + fixes.maxOf { it.lat }) / 2
            val cosLat = cos(Math.toRadians(midLat))
            fun projX(f: LiveViewModel.Fix) = f.lng * cosLat
            fun projY(f: LiveViewModel.Fix) = f.lat
            val minX = fixes.minOf { projX(it) }; val maxX = fixes.maxOf { projX(it) }
            val minY = fixes.minOf { projY(it) }; val maxY = fixes.maxOf { projY(it) }
            val spanX = max(maxX - minX, 1e-12); val spanY = max(maxY - minY, 1e-12)
            val rect = Rect(60f, 200f, size.width - 60f, size.height - 220f)
            val sc = min(rect.width / spanX, rect.height / spanY)
            val cx = (minX + maxX) / 2; val cy = (minY + maxY) / 2
            fun screen(f: LiveViewModel.Fix) = Offset(
                (rect.center.x + (projX(f) - cx) * sc).toFloat(),
                (rect.center.y - (projY(f) - cy) * sc).toFloat(),
            )
            val pts = fixes.map { screen(it) }

            if (pts.size > 1) {
                val route = Path().apply {
                    moveTo(pts[0].x, pts[0].y)
                    pts.drop(1).forEach { lineTo(it.x, it.y) }
                }
                drawPath(route, c.accent, style = Stroke(width = 3.5f, cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
            pts.firstOrNull()?.let { drawRect(on.copy(alpha = 0.7f), Offset(it.x - 5f, it.y - 5f), Size(10f, 10f), style = Stroke(2f)) }

            val cp = pts.last()
            drawCircle(c.accent.copy(alpha = 0.45f * (1f - ping)), 12f + 22f * ping, cp)
            drawCircle(c.accent, 8f, cp)
            drawCircle(on, 8f, cp, style = Stroke(2.5f))

            // "<DOG> · HERE" label, sized to the dog's actual name.
            val layout = measurer.measure("${dogLabel.uppercase()} · HERE",
                style = TextStyle(fontFamily = JetBrainsMono, fontSize = 9f.toSp(), color = on))
            val lblTL = Offset(cp.x + 12f, cp.y - 9f)
            val lblSize = Size(layout.size.width + 18f, 19f)
            drawRoundRect(c.inverse.copy(alpha = 0.82f), lblTL, lblSize, CornerRadius(5f))
            drawRoundRect(on.copy(alpha = 0.18f), lblTL, lblSize, CornerRadius(5f), style = Stroke(1f))
            drawText(layout, topLeft = Offset(lblTL.x + 9f, lblTL.y + (19f - layout.size.height) / 2f))
        }

        // scrims
        Box(Modifier.fillMaxWidth().height(210.dp).align(Alignment.TopCenter)
            .background(Brush.verticalGradient(listOf(c.inverseScrim.copy(alpha = 0.94f), Color.Transparent))))
        Box(Modifier.fillMaxWidth().height(250.dp).align(Alignment.BottomCenter)
            .background(Brush.verticalGradient(listOf(Color.Transparent, c.inverseScrim.copy(alpha = 0.96f)))))

        // top HUD
        Column(Modifier.align(Alignment.TopStart).statusBarsPadding().fillMaxWidth()
            .padding(horizontal = 18.dp, vertical = 10.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                HudDot(c.accent)
                Spacer(Modifier.width(7.dp))
                MonoText(if (state.phase == LiveViewModel.Phase.TRACKING) "Live · Walk in progress" else "Live · Connecting", on)
                Spacer(Modifier.weight(1f))
                if (state.phase != LiveViewModel.Phase.NO_BOOKING) {
                    Box(
                        Modifier.clip(RoundedCornerShape(50)).border(1.dp, on.copy(alpha = 0.3f), RoundedCornerShape(50))
                            .clickable { viewModel.simulate() }.padding(horizontal = 10.dp, vertical = 4.dp)
                    ) { MonoText("▶ Demo", on, sizeSp = 9f, trackingEm = 0.06f, upper = false) }
                    Spacer(Modifier.width(10.dp))
                }
                Box(Modifier.clickable { onClose() }) { ExpandIcon(on.copy(alpha = 0.55f), 13.dp) }
            }
            Row(Modifier.padding(top = 18.dp), verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                Column {
                    MonoText("Elapsed", on.copy(alpha = 0.5f), sizeSp = 9f)
                    MonoText(elapsedLabel(state.startedAtMs, nowMs), on, sizeSp = 34f, weight = FontWeight.Normal,
                        trackingEm = -0.03f, upper = false, modifier = Modifier.padding(top = 3.dp))
                }
                Column(Modifier.padding(bottom = 3.dp)) {
                    MonoText("Distance", on.copy(alpha = 0.5f), sizeSp = 9f)
                    DmText(distanceLabel(state.fixes), on, sizeSp = 18f, weight = FontWeight.SemiBold, modifier = Modifier.padding(top = 5.dp))
                }
                Column(Modifier.padding(bottom = 3.dp)) {
                    MonoText("Pace", on.copy(alpha = 0.5f), sizeSp = 9f)
                    DmText(paceLabel(state.fixes, state.startedAtMs, nowMs), on, sizeSp = 18f, weight = FontWeight.SemiBold, modifier = Modifier.padding(top = 5.dp))
                }
            }
        }

        // bottom HUD
        Column(Modifier.align(Alignment.BottomStart).navigationBarsPadding().fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 16.dp)) {
            statusMessage(state)?.let { msg ->
                Row(Modifier.clip(RoundedCornerShape(50)).background(c.inverse2.copy(alpha = 0.7f))
                    .padding(horizontal = 12.dp, vertical = 8.dp)) {
                    MonoText(msg, on.copy(alpha = 0.85f), sizeSp = 10f, weight = FontWeight.Normal, upper = false)
                }
                Spacer(Modifier.height(11.dp))
            }
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp))
                    .background(Color(0xFF2A3440).copy(alpha = 0.85f))
                    .border(1.dp, on.copy(alpha = 0.14f), RoundedCornerShape(18.dp))
                    .padding(horizontal = 12.dp, vertical = 11.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(Modifier.size(40.dp).clip(RoundedCornerShape(50)).background(c.inverse2)
                    .border(1.dp, on.copy(alpha = 0.22f), RoundedCornerShape(50)), Alignment.Center) {
                    PawIcon(on.copy(alpha = 0.5f), 16.dp)
                }
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f)) {
                    DmText(dogLabel, on, sizeSp = 14f, weight = FontWeight.SemiBold)
                    MonoText("${state.fixes.size} fixes · live", on.copy(alpha = 0.6f), sizeSp = 9f,
                        weight = FontWeight.Normal, trackingEm = 0.07f)
                }
            }
        }
    }
}

private fun elapsedLabel(startedAtMs: Long?, nowMs: Long): String {
    if (startedAtMs == null) return "00:00"
    val s = ((nowMs - startedAtMs) / 1000).coerceAtLeast(0)
    return "%02d:%02d".format(s / 60, s % 60)
}

private fun distanceLabel(fixes: List<LiveViewModel.Fix>): String {
    val m = LiveViewModel.distanceMeters(fixes)
    return if (m < 1000) "${m.toInt()} m" else "%.2f km".format(m / 1000)
}

private fun paceLabel(fixes: List<LiveViewModel.Fix>, startedAtMs: Long?, nowMs: Long): String {
    val m = LiveViewModel.distanceMeters(fixes)
    if (startedAtMs == null || m <= 20) return "—"
    val minutes = (nowMs - startedAtMs) / 60000.0
    val pace = minutes / (m / 1000.0)
    if (!pace.isFinite() || pace >= 99) return "—"
    return "%d′%02d″/km".format(pace.toInt(), ((pace - pace.toInt()) * 60).toInt())
}

private fun statusMessage(state: LiveViewModel.State): String? = when (state.phase) {
    LiveViewModel.Phase.NO_BOOKING -> "No active walk to track — book one first."
    LiveViewModel.Phase.DENIED -> "Location access is off. Enable it in Settings to track."
    LiveViewModel.Phase.FAILED -> "Lost connection to the tracker."
    LiveViewModel.Phase.CONNECTING -> if (state.fixes.isEmpty()) "Acquiring GPS…" else null
    LiveViewModel.Phase.TRACKING -> if (state.fixes.isEmpty()) "Waiting for the first fix…" else null
}
