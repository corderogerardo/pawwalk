package com.pawwalk.android.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.data.Walker

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalkersScreen(viewModel: WalkersViewModel = viewModel()) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Find a walker") }) }
    ) { padding ->
        when (val s = state) {
            is WalkersViewModel.UiState.Loading ->
                Column(
                    Modifier.fillMaxSize().padding(padding),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) { CircularProgressIndicator() }

            is WalkersViewModel.UiState.Error ->
                Column(
                    Modifier.fillMaxSize().padding(padding),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) { Text("Couldn't load walkers: ${s.message}") }

            is WalkersViewModel.UiState.Success ->
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(s.walkers) { walker -> WalkerCard(walker) }
                }
        }
    }
}

@Composable
private fun WalkerCard(walker: Walker) {
    Card {
        Column(Modifier.fillMaxSize().padding(16.dp)) {
            Text(walker.name, style = MaterialTheme.typography.titleMedium)
            Text(
                "⭐ ${walker.rating}  ·  ${walker.priceLabel}",
                style = MaterialTheme.typography.bodyMedium,
            )
            Text(walker.bio, style = MaterialTheme.typography.bodySmall)
            Text(
                walker.neighborhoods.joinToString(" · "),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}
