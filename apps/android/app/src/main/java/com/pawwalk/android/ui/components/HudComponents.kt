package com.pawwalk.android.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import com.pawwalk.android.ui.theme.DMSans
import com.pawwalk.android.ui.theme.JetBrainsMono

/** JetBrains Mono caption — the recurring uppercase readout style. */
@Composable
fun MonoText(
    text: String,
    color: Color,
    sizeSp: Float = 10f,
    weight: FontWeight = FontWeight.Medium,
    trackingEm: Float = 0.12f,
    upper: Boolean = true,
    modifier: Modifier = Modifier,
) {
    Text(
        text = if (upper) text.uppercase() else text,
        modifier = modifier,
        color = color,
        fontFamily = JetBrainsMono,
        fontWeight = weight,
        fontSize = sizeSp.sp,
        letterSpacing = trackingEm.em,
        lineHeight = (sizeSp * 1.15f).sp,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
    )
}

/** DM Sans display/UI text. */
@Composable
fun DmText(
    text: String,
    color: Color,
    sizeSp: Float,
    weight: FontWeight = FontWeight.Normal,
    trackingEm: Float = 0f,
    modifier: Modifier = Modifier,
) {
    Text(
        text = text,
        modifier = modifier,
        color = color,
        fontFamily = DMSans,
        fontWeight = weight,
        fontSize = sizeSp.sp,
        letterSpacing = trackingEm.em,
        lineHeight = (sizeSp * 0.98f).sp,
    )
}

/** Status dot with an expanding radar pulse. */
@Composable
fun HudDot(color: Color, sizeDp: Dp = 8.dp, modifier: Modifier = Modifier) {
    val t = rememberInfiniteTransition(label = "dot")
    val scale by t.animateFloat(
        1f, 1.9f,
        infiniteRepeatable(tween(1900, easing = LinearEasing), RepeatMode.Restart), label = "scale"
    )
    val alpha by t.animateFloat(
        0.22f, 0f,
        infiniteRepeatable(tween(1900, easing = LinearEasing), RepeatMode.Restart), label = "alpha"
    )
    Box(modifier.size(sizeDp), contentAlignment = Alignment.Center) {
        Box(
            Modifier.size(sizeDp).graphicsLayer { scaleX = scale; scaleY = scale; this.alpha = alpha }
                .background(color, CircleShape)
        )
        Box(Modifier.size(sizeDp).background(color, CircleShape))
    }
}
