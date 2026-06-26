package com.pawwalk.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.pawwalk.android.ui.screens.WalkersScreen
import com.pawwalk.android.ui.theme.PawWalkTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PawWalkTheme {
                Surface(Modifier.fillMaxSize()) {
                    WalkersScreen()
                }
            }
        }
    }
}
