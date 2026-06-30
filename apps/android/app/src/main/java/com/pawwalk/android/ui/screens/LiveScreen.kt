package com.pawwalk.android.ui.screens

import androidx.activity.compose.BackHandler
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
import androidx.compose.runtime.getValue
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
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pawwalk.android.ui.components.ChatIcon
import com.pawwalk.android.ui.components.ExpandIcon
import com.pawwalk.android.ui.components.HudDot
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.components.PersonIcon
import com.pawwalk.android.ui.components.PhoneIcon
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.theme.JetBrainsMono
import com.pawwalk.android.ui.theme.Hud

/** PawWalk — Live GPS Tracking (hero). Dark mission-control map + telemetry HUD. */
@Composable
fun LiveScreen(onClose: () -> Unit) {
    BackHandler { onClose() }
    val c = Hud.colors
    val on = c.onInverse
    val measurer = rememberTextMeasurer()

    val inf = rememberInfiniteTransition(label = "live")
    val dash by inf.animateFloat(0f, 16f,
        infiniteRepeatable(tween(800, easing = LinearEasing), RepeatMode.Restart), label = "dash")
    val ping by inf.animateFloat(0f, 1f,
        infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Restart), label = "ping")

    Box(Modifier.fillMaxSize().background(c.inverse)) {
        Canvas(Modifier.fillMaxSize()) {
            val scale = maxOf(size.width / 390f, size.height / 862f)
            val ox = (size.width - 390f * scale) / 2f
            val oy = (size.height - 862f * scale) / 2f
            fun p(x: Float, y: Float) = Offset(x * scale + ox, y * scale + oy)

            // grid
            var gx = 0f
            while (gx <= 390f) { drawLine(on.copy(alpha = 0.05f), p(gx, 0f), p(gx, 862f), 1f); gx += 39f }
            var gy = 0f
            while (gy <= 862f) { drawLine(on.copy(alpha = 0.05f), p(0f, gy), p(390f, gy), 1f); gy += 39f }

            // faint blocks
            fun block(x: Float, y: Float, w: Float, h: Float, col: Color) =
                drawRoundRect(col, p(x, y), Size(w * scale, h * scale), CornerRadius(10f * scale))
            block(196f, 332f, 150f, 120f, on.copy(alpha = 0.04f))
            block(40f, 240f, 92f, 120f, c.signalGreen.copy(alpha = 0.06f))
            block(150f, 500f, 120f, 80f, on.copy(alpha = 0.04f))

            // dashed remaining route (marching)
            val dashed = Path().apply {
                moveTo(p(300f, 300f).x, p(300f, 300f).y)
                listOf(300f to 238f, 230f to 208f, 160f to 220f, 150f to 300f).forEach { lineTo(p(it.first, it.second).x, p(it.first, it.second).y) }
            }
            drawPath(dashed, on.copy(alpha = 0.38f), style = Stroke(
                width = 2.5f * scale, cap = StrokeCap.Round, join = StrokeJoin.Round,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(3f * scale, 8f * scale), -dash * scale)))

            // traveled route (solid accent)
            val route = Path().apply {
                val pts = listOf(60f to 600f, 60f to 520f, 120f to 470f, 120f to 400f, 200f to 360f, 270f to 360f, 300f to 300f)
                moveTo(p(pts[0].first, pts[0].second).x, p(pts[0].first, pts[0].second).y)
                pts.drop(1).forEach { lineTo(p(it.first, it.second).x, p(it.first, it.second).y) }
            }
            drawPath(route, c.accent, style = Stroke(width = 3.5f * scale, cap = StrokeCap.Round, join = StrokeJoin.Round))

            // start marker (square outline)
            drawRect(on.copy(alpha = 0.7f), p(55f, 595f), Size(10f * scale, 10f * scale), style = Stroke(2f * scale))
            // event pins
            drawCircle(c.pinBlue, 4f * scale, p(120f, 470f))
            drawCircle(c.pinAmber, 4f * scale, p(200f, 360f))
            // home end ring
            drawCircle(on.copy(alpha = 0.55f), 5f * scale, p(150f, 300f), style = Stroke(2f * scale))

            // current position — pulsing ping
            val cp = p(300f, 300f)
            drawCircle(c.accent.copy(alpha = 0.45f * (1f - ping)), (12f + 22f * ping) * scale, cp)
            drawCircle(c.accent, 8f * scale, cp)
            drawCircle(on, 8f * scale, cp, style = Stroke(2.5f * scale))

            // "MOCHI · HERE" label
            val lblTL = p(247f, 315f)
            drawRoundRect(c.inverse.copy(alpha = 0.82f), lblTL, Size(106f * scale, 19f * scale), CornerRadius(5f * scale))
            drawRoundRect(on.copy(alpha = 0.18f), lblTL, Size(106f * scale, 19f * scale), CornerRadius(5f * scale), style = Stroke(1f))
            val layout = measurer.measure(
                "MOCHI · HERE",
                style = TextStyle(fontFamily = JetBrainsMono, fontSize = (9f * scale).toSp(), color = on)
            )
            drawText(layout, topLeft = Offset(lblTL.x + 9f * scale, lblTL.y + (19f * scale - layout.size.height) / 2f))
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
                MonoText("Live · Walk in progress", on)
                Spacer(Modifier.weight(1f))
                Box(Modifier.clickable { onClose() }) { ExpandIcon(on.copy(alpha = 0.55f), 13.dp) }
            }
            Row(Modifier.padding(top = 18.dp), verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                Column {
                    MonoText("Elapsed", on.copy(alpha = 0.5f), sizeSp = 9f)
                    MonoText("18:42", on, sizeSp = 34f, weight = FontWeight.Normal, trackingEm = -0.03f,
                        upper = false, modifier = Modifier.padding(top = 3.dp))
                }
                Column(Modifier.padding(bottom = 3.dp)) {
                    MonoText("Distance", on.copy(alpha = 0.5f), sizeSp = 9f)
                    DmText("2.4 km", on, sizeSp = 18f, weight = FontWeight.SemiBold, modifier = Modifier.padding(top = 5.dp))
                }
                Column(Modifier.padding(bottom = 3.dp)) {
                    MonoText("Pace", on.copy(alpha = 0.5f), sizeSp = 9f)
                    DmText("12′/km", on, sizeSp = 18f, weight = FontWeight.SemiBold, modifier = Modifier.padding(top = 5.dp))
                }
            }
        }

        // bottom HUD
        Column(Modifier.align(Alignment.BottomStart).navigationBarsPadding().fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 16.dp)) {
            EventRow(on, "16:28", c.pinAmber, "Sniff stop · 0:48")
            Spacer(Modifier.height(6.dp))
            EventRow(on, "16:24", c.pinBlue, "Pee break logged")
            Spacer(Modifier.height(11.dp))
            // walker control card
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp))
                    .background(Color(0xFF2A3440).copy(alpha = 0.85f))
                    .border(1.dp, on.copy(alpha = 0.14f), RoundedCornerShape(18.dp))
                    .padding(horizontal = 12.dp, vertical = 11.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(Modifier.size(40.dp).clip(RoundedCornerShape(50)).background(c.inverse2)
                    .border(1.dp, on.copy(alpha = 0.22f), RoundedCornerShape(50)), Alignment.Center) {
                    PersonIcon(on.copy(alpha = 0.5f), 16.dp)
                }
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f)) {
                    DmText("Elena Vega", on, sizeSp = 14f, weight = FontWeight.SemiBold)
                    MonoText("Unit 07 · walking now", on.copy(alpha = 0.6f), sizeSp = 9f,
                        weight = FontWeight.Normal, trackingEm = 0.07f)
                }
                Box(Modifier.size(42.dp).clip(RoundedCornerShape(13.dp))
                    .border(1.dp, on.copy(alpha = 0.18f), RoundedCornerShape(13.dp)), Alignment.Center) {
                    ChatIcon(on, 15.dp)
                }
                Spacer(Modifier.width(8.dp))
                Box(Modifier.size(42.dp).clip(RoundedCornerShape(13.dp)).background(c.signalGreen), Alignment.Center) {
                    PhoneIcon(on, 15.dp)
                }
            }
        }
    }
}

@Composable
private fun EventRow(on: Color, time: String, dot: Color, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        MonoText(time, on.copy(alpha = 0.45f), sizeSp = 9f, weight = FontWeight.Normal, upper = false,
            modifier = Modifier.width(38.dp))
        Spacer(Modifier.width(9.dp))
        Box(Modifier.size(5.dp).clip(RoundedCornerShape(50)).background(dot))
        Spacer(Modifier.width(9.dp))
        MonoText(text, on.copy(alpha = 0.8f), sizeSp = 9.5f, weight = FontWeight.Normal, trackingEm = 0.06f)
    }
}
