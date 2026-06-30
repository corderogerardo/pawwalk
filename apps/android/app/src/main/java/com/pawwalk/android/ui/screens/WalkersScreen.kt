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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.data.Walker
import com.pawwalk.android.ui.components.ChevronRightIcon
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.theme.BrandColors
import com.pawwalk.android.ui.theme.Hud

@Composable
fun WalkersScreen(
    onWalkerSelected: (Walker) -> Unit,
    viewModel: WalkersViewModel = viewModel(),
) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()

    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(Modifier.fillMaxSize().statusBarsPadding().padding(horizontal = 20.dp).padding(top = 10.dp)) {
            MonoText("Find a walker", c.ink.copy(alpha = 0.6f), modifier = Modifier.padding(bottom = 14.dp))

            when (val s = state) {
                is WalkersViewModel.UiState.Loading ->
                    Column(
                        Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) { CircularProgressIndicator(color = c.accent) }

                is WalkersViewModel.UiState.Error ->
                    Column(
                        Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) { MonoText("Couldn't load walkers: ${s.message}", c.ink.copy(alpha = 0.6f), upper = false) }

                is WalkersViewModel.UiState.Success ->
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(s.walkers) { walker -> WalkerCard(c, walker, onClick = { onWalkerSelected(walker) }) }
                    }
            }
        }
    }
}

@Composable
private fun WalkerCard(c: BrandColors, walker: Walker, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(c.canvasDeep.copy(alpha = 0.4f))
            .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            DmText(walker.name, c.ink, sizeSp = 15f, weight = FontWeight.SemiBold)
            Row(Modifier.padding(top = 5.dp)) {
                MonoText("★ ${walker.rating}", c.ink.copy(alpha = 0.6f), sizeSp = 9f, weight = FontWeight.Normal,
                    trackingEm = 0.07f, upper = false)
                Spacer(Modifier.width(8.dp))
                MonoText(walker.priceLabel, c.accent, sizeSp = 9f, weight = FontWeight.Normal,
                    trackingEm = 0.07f, upper = false)
            }
            if (walker.bio.isNotBlank()) {
                DmText(walker.bio, c.ink.copy(alpha = 0.7f), sizeSp = 12f, modifier = Modifier.padding(top = 6.dp))
            }
            if (walker.neighborhoods.isNotEmpty()) {
                MonoText(walker.neighborhoods.joinToString(" · "), c.ink.copy(alpha = 0.45f), sizeSp = 8.5f,
                    trackingEm = 0.07f, modifier = Modifier.padding(top = 6.dp))
            }
        }
        ChevronRightIcon(c.ink.copy(alpha = 0.35f), size = 16.dp)
    }
}
