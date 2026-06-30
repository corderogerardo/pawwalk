package com.pawwalk.android.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import com.pawwalk.android.R

// PawWalk "Subtle HUD" design system — ported from the design handoff.
// DM Sans display + JetBrains Mono readouts; indigo accent, cool paper, full light/dark.

val DMSans = FontFamily(
    Font(R.font.dmsans_regular, FontWeight.Normal),
    Font(R.font.dmsans_medium, FontWeight.Medium),
    Font(R.font.dmsans_semibold, FontWeight.SemiBold),
    Font(R.font.dmsans_bold, FontWeight.Bold),
)

val JetBrainsMono = FontFamily(
    Font(R.font.jetbrainsmono_regular, FontWeight.Normal),
    Font(R.font.jetbrainsmono_medium, FontWeight.Medium),
    Font(R.font.jetbrainsmono_semibold, FontWeight.SemiBold),
)

/** Semantic design tokens (mirrors the CSS custom properties in the handoff). */
data class BrandColors(
    val canvas: Color,
    val canvasDeep: Color,
    val ink: Color,
    val accent: Color,
    val inverse: Color,
    val inverse2: Color,
    val onInverse: Color,
    val inverseScrim: Color,
    // Fixed signal colors (same in both themes)
    val signalGreen: Color = Color(0xFF4A7A5E),
    val signalGreenSoft: Color = Color(0xFF9FD3C0),
    val pinBlue: Color = Color(0xFF457B9D),
    val pinAmber: Color = Color(0xFFC68A1E),
)

val LightBrand = BrandColors(
    canvas = Color(0xFFF5F3FA),
    canvasDeep = Color(0xFFE7E4F2),
    ink = Color(0xFF171327),
    accent = Color(0xFF5B4BE0),
    inverse = Color(0xFF171327),
    inverse2 = Color(0xFF2C2647),
    onInverse = Color(0xFFF5F3FA),
    inverseScrim = Color(0xFF171327),
)

val DarkBrand = BrandColors(
    canvas = Color(0xFF0E0A1C),
    canvasDeep = Color(0xFF1C1636),
    ink = Color(0xFFECEAF7),
    accent = Color(0xFF8E7DFF),
    inverse = Color(0xFF221B3F),
    inverse2 = Color(0xFF2E2752),
    onInverse = Color(0xFFF4F2FC),
    inverseScrim = Color(0xFF07050F),
)

val LocalBrand = staticCompositionLocalOf { LightBrand }

/** Ergonomic accessor: `Hud.colors.accent`. */
object Hud {
    val colors: BrandColors
        @Composable get() = LocalBrand.current
}
