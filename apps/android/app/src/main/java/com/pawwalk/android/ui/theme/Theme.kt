package com.pawwalk.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color

// The HUD brand is a fixed indigo identity (not Material You dynamic color), so the
// app looks the same across devices. Material 3 scheme is derived from the brand
// tokens; the richer HUD tokens are provided via LocalBrand (see Brand.kt).

private val LightColors = lightColorScheme(
    primary = LightBrand.accent,
    onPrimary = LightBrand.onInverse,
    background = LightBrand.canvas,
    onBackground = LightBrand.ink,
    surface = LightBrand.canvas,
    onSurface = LightBrand.ink,
)

private val DarkColors = darkColorScheme(
    primary = DarkBrand.accent,
    onPrimary = Color(0xFF120E24),
    background = DarkBrand.canvas,
    onBackground = DarkBrand.ink,
    surface = DarkBrand.canvas,
    onSurface = DarkBrand.ink,
)

@Composable
fun PawWalkTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val brand = if (darkTheme) DarkBrand else LightBrand
    val colorScheme = if (darkTheme) DarkColors else LightColors
    CompositionLocalProvider(LocalBrand provides brand) {
        MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
    }
}
