package com.pawwalk.android.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColors = lightColorScheme(
    primary = BrandGreen,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    primaryContainer = BrandGreenContainer,
    secondary = BrandGreenDark,
    background = Sand,
    onBackground = Bark,
)

private val DarkColors = darkColorScheme(
    primary = BrandGreenContainer,
    secondary = BrandGreen,
)

@Composable
fun PawWalkTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Material You dynamic color, Android 12+ (learn how this adapts to the user's wallpaper).
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val ctx = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(ctx) else dynamicLightColorScheme(ctx)
        }
        darkTheme -> DarkColors
        else -> LightColors
    }
    MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
