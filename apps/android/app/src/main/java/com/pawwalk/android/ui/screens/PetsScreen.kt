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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.data.CreatePetRequest
import com.pawwalk.android.data.Pet
import com.pawwalk.android.data.PetRepository
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.components.PawIcon
import com.pawwalk.android.ui.theme.Hud
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PetsViewModel : ViewModel() {
    sealed interface UiState {
        data object Loading : UiState
        data class Success(val pets: List<Pet>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try { UiState.Success(PetRepository.list()) }
            catch (e: Exception) { UiState.Error(e.message ?: "Couldn't load pets") }
        }
    }

    fun add(request: CreatePetRequest) {
        viewModelScope.launch { runCatching { PetRepository.create(request) }; load() }
    }

    fun delete(id: String) {
        viewModelScope.launch { runCatching { PetRepository.delete(id) }; load() }
    }
}

@Composable
fun PetsScreen(onClose: () -> Unit, viewModel: PetsViewModel = viewModel()) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()
    var showAdd by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(Modifier.fillMaxSize().statusBarsPadding().padding(horizontal = 20.dp).padding(top = 10.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                MonoText("← Back", c.ink.copy(alpha = 0.6f), modifier = Modifier.clickable { onClose() })
                Spacer(Modifier.weight(1f))
                MonoText("+ Add", c.accent, modifier = Modifier.clickable { showAdd = true })
            }
            DmText("Your pets.", c.ink, sizeSp = 28f, weight = FontWeight.Medium, trackingEm = -0.03f,
                modifier = Modifier.padding(top = 14.dp, bottom = 18.dp))

            when (val s = state) {
                is PetsViewModel.UiState.Loading ->
                    Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(color = c.accent) }
                is PetsViewModel.UiState.Error ->
                    Box(Modifier.fillMaxSize(), Alignment.Center) {
                        MonoText(s.message, c.ink.copy(alpha = 0.6f), upper = false)
                    }
                is PetsViewModel.UiState.Success -> if (s.pets.isEmpty()) {
                    Box(Modifier.fillMaxSize(), Alignment.Center) {
                        MonoText("No pets yet — tap + Add", c.ink.copy(alpha = 0.5f), upper = false)
                    }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(s.pets, key = { it.id }) { pet ->
                            Row(
                                Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                                    .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Box(Modifier.size(40.dp).border(1.5.dp, c.ink, RoundedCornerShape(12.dp)), Alignment.Center) {
                                    PawIcon(c.ink, size = 18.dp)
                                }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    DmText(pet.name, c.ink, sizeSp = 15f, weight = FontWeight.SemiBold)
                                    if (pet.subtitle.isNotEmpty()) {
                                        MonoText(pet.subtitle, c.ink.copy(alpha = 0.6f), sizeSp = 9f,
                                            weight = FontWeight.Normal, trackingEm = 0.06f)
                                    }
                                }
                                MonoText("Remove", Color(0xFFC0392B), sizeSp = 9f, upper = false,
                                    modifier = Modifier.clickable { viewModel.delete(pet.id) })
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAdd) {
        AddPetDialog(onDismiss = { showAdd = false }) { req -> viewModel.add(req); showAdd = false }
    }
}

@Composable
private fun AddPetDialog(onDismiss: () -> Unit, onSave: (CreatePetRequest) -> Unit) {
    val c = Hud.colors
    var name by remember { mutableStateOf("") }
    var breed by remember { mutableStateOf("") }
    var age by remember { mutableStateOf("") }
    var weight by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { DmText("Add a pet", c.ink, sizeSp = 18f, weight = FontWeight.SemiBold) },
        text = {
            Column {
                OutlinedTextField(name, { name = it }, label = { DmText("Name", c.ink.copy(alpha = 0.6f), 13f) }, singleLine = true)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(breed, { breed = it }, label = { DmText("Breed", c.ink.copy(alpha = 0.6f), 13f) }, singleLine = true)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(age, { age = it }, label = { DmText("Age (years)", c.ink.copy(alpha = 0.6f), 13f) },
                    singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(weight, { weight = it }, label = { DmText("Weight (kg)", c.ink.copy(alpha = 0.6f), 13f) },
                    singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(CreatePetRequest(name.trim(), breed.trim(), age.toDoubleOrNull(), weight.toDoubleOrNull(), null))
                },
                enabled = name.isNotBlank(),
            ) { DmText("Save", c.accent, 14f, weight = FontWeight.SemiBold) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { DmText("Cancel", c.ink.copy(alpha = 0.6f), 14f) } },
    )
}
