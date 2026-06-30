package com.pawwalk.android.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

// Lightweight custom HUD icons drawn with Canvas — no icon dependency, consistent
// thin-line style. All draw inside a square of the given size.

private fun DrawScope.strokePath(tint: Color, width: Float, block: Path.() -> Unit) {
    val p = Path().apply(block)
    drawPath(p, color = tint, style = Stroke(width = width, cap = androidx.compose.ui.graphics.StrokeCap.Round,
        join = androidx.compose.ui.graphics.StrokeJoin.Round))
}

@androidx.compose.runtime.Composable
fun PawIcon(tint: Color, size: Dp = 18.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    // pad
    drawOval(tint, topLeft = Offset(s * 0.28f, s * 0.46f), size = Size(s * 0.44f, s * 0.38f))
    // toes
    val r = s * 0.11f
    drawCircle(tint, r, Offset(s * 0.30f, s * 0.34f))
    drawCircle(tint, r, Offset(s * 0.70f, s * 0.34f))
    drawCircle(tint, r * 0.9f, Offset(s * 0.44f, s * 0.22f))
    drawCircle(tint, r * 0.9f, Offset(s * 0.56f, s * 0.22f))
}

@androidx.compose.runtime.Composable
fun LocationArrowIcon(tint: Color, size: Dp = 14.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    strokePath(tint, s * 0.09f) {
        moveTo(s * 0.86f, s * 0.16f); lineTo(s * 0.16f, s * 0.46f)
        lineTo(s * 0.48f, s * 0.54f); lineTo(s * 0.56f, s * 0.86f); close()
    }
}

@androidx.compose.runtime.Composable
fun ChatIcon(tint: Color, size: Dp = 15.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    strokePath(tint, s * 0.08f) {
        moveTo(s * 0.16f, s * 0.20f); lineTo(s * 0.84f, s * 0.20f); lineTo(s * 0.84f, s * 0.64f)
        lineTo(s * 0.40f, s * 0.64f); lineTo(s * 0.24f, s * 0.82f); lineTo(s * 0.24f, s * 0.64f)
        lineTo(s * 0.16f, s * 0.64f); close()
    }
}

@androidx.compose.runtime.Composable
fun ChevronRightIcon(tint: Color, size: Dp = 16.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    strokePath(tint, s * 0.10f) {
        moveTo(s * 0.40f, s * 0.26f); lineTo(s * 0.64f, s * 0.50f); lineTo(s * 0.40f, s * 0.74f)
    }
}

@androidx.compose.runtime.Composable
fun CalendarIcon(tint: Color, size: Dp = 15.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    val w = s * 0.07f
    strokePath(tint, w) {
        addRoundRect(androidx.compose.ui.geometry.RoundRect(
            s * 0.16f, s * 0.22f, s * 0.84f, s * 0.84f,
            androidx.compose.ui.geometry.CornerRadius(s * 0.08f)))
    }
    drawLine(tint, Offset(s * 0.16f, s * 0.38f), Offset(s * 0.84f, s * 0.38f), w)
    drawLine(tint, Offset(s * 0.34f, s * 0.14f), Offset(s * 0.34f, s * 0.26f), w)
    drawLine(tint, Offset(s * 0.66f, s * 0.14f), Offset(s * 0.66f, s * 0.26f), w)
}

@androidx.compose.runtime.Composable
fun HomeIcon(tint: Color, size: Dp = 15.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    strokePath(tint, s * 0.08f) {
        moveTo(s * 0.18f, s * 0.46f); lineTo(s * 0.50f, s * 0.18f); lineTo(s * 0.82f, s * 0.46f)
        moveTo(s * 0.26f, s * 0.42f); lineTo(s * 0.26f, s * 0.80f); lineTo(s * 0.74f, s * 0.80f); lineTo(s * 0.74f, s * 0.42f)
    }
}

@androidx.compose.runtime.Composable
fun PersonIcon(tint: Color, size: Dp = 15.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    drawCircle(tint, s * 0.17f, Offset(s * 0.5f, s * 0.34f))
    val p = Path().apply {
        moveTo(s * 0.22f, s * 0.82f)
        cubicTo(s * 0.22f, s * 0.58f, s * 0.78f, s * 0.58f, s * 0.78f, s * 0.82f)
        close()
    }
    drawPath(p, tint)
}

@androidx.compose.runtime.Composable
fun CheckIcon(tint: Color, size: Dp = 9.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    strokePath(tint, s * 0.16f) {
        moveTo(s * 0.20f, s * 0.52f); lineTo(s * 0.42f, s * 0.72f); lineTo(s * 0.80f, s * 0.28f)
    }
}

@androidx.compose.runtime.Composable
fun ExpandIcon(tint: Color, size: Dp = 13.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    val w = s * 0.09f
    strokePath(tint, w) {
        moveTo(s * 0.20f, s * 0.36f); lineTo(s * 0.20f, s * 0.20f); lineTo(s * 0.36f, s * 0.20f)
        moveTo(s * 0.80f, s * 0.64f); lineTo(s * 0.80f, s * 0.80f); lineTo(s * 0.64f, s * 0.80f)
    }
}

@androidx.compose.runtime.Composable
fun LogoutIcon(tint: Color, size: Dp = 15.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    val w = s * 0.09f
    strokePath(tint, w) {
        // door frame
        moveTo(s * 0.52f, s * 0.18f); lineTo(s * 0.24f, s * 0.18f); lineTo(s * 0.24f, s * 0.82f); lineTo(s * 0.52f, s * 0.82f)
    }
    strokePath(tint, w) {
        // arrow pointing out
        moveTo(s * 0.42f, s * 0.50f); lineTo(s * 0.82f, s * 0.50f)
        moveTo(s * 0.64f, s * 0.32f); lineTo(s * 0.84f, s * 0.50f); lineTo(s * 0.64f, s * 0.68f)
    }
}

@androidx.compose.runtime.Composable
fun PhoneIcon(tint: Color, size: Dp = 15.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    val p = Path().apply {
        moveTo(s * 0.24f, s * 0.18f)
        lineTo(s * 0.40f, s * 0.18f); lineTo(s * 0.48f, s * 0.38f); lineTo(s * 0.38f, s * 0.46f)
        cubicTo(s * 0.44f, s * 0.58f, s * 0.52f, s * 0.66f, s * 0.64f, s * 0.72f)
        lineTo(s * 0.72f, s * 0.62f); lineTo(s * 0.92f, s * 0.70f); lineTo(s * 0.92f, s * 0.86f)
        cubicTo(s * 0.60f, s * 0.92f, s * 0.18f, s * 0.50f, s * 0.24f, s * 0.18f)
        close()
    }
    drawPath(p, tint)
}
