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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.components.PawIcon
import com.pawwalk.android.ui.theme.DMSans
import com.pawwalk.android.ui.theme.Hud

/**
 * Login / sign-up gate shown when there's no valid session. Toggles between
 * the two modes rather than using two separate screens — they share almost
 * all of their fields and validation.
 */
@Composable
fun AuthScreen(viewModel: AuthViewModel = viewModel()) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()

    var isSignup by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("owner") }
    var validationError by remember { mutableStateOf<String?>(null) }

    val loading = state is AuthViewModel.UiState.Loading
    val serverError = (state as? AuthViewModel.UiState.Error)?.message

    fun submit() {
        validationError = validate(email, password, name, isSignup)
        if (validationError != null) return
        if (isSignup) viewModel.signup(email.trim(), password, name.trim(), role)
        else viewModel.login(email.trim(), password)
    }

    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .imePadding()
                .padding(horizontal = 24.dp)
                .padding(top = 64.dp, bottom = 32.dp),
        ) {
            Box(Modifier.size(54.dp).border(1.5.dp, c.ink, RoundedCornerShape(16.dp))) {
                PawIcon(c.ink, size = 22.dp, modifier = Modifier.align(Alignment.Center))
            }
            DmText(
                if (isSignup) "Create account." else "Welcome back.",
                c.ink, sizeSp = 32f, weight = FontWeight.Medium, trackingEm = -0.03f,
                modifier = Modifier.padding(top = 18.dp),
            )
            MonoText(
                if (isSignup) "Sign up to book a walk" else "Log in to your account",
                c.ink.copy(alpha = 0.55f), sizeSp = 10.5f, weight = FontWeight.Normal,
                trackingEm = 0.08f, modifier = Modifier.padding(top = 6.dp),
            )

            Spacer(Modifier.height(32.dp))

            if (isSignup) {
                MonoText("I am a", c.ink.copy(alpha = 0.55f), sizeSp = 9.5f, trackingEm = 0.1f)
                Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    RolePill("Pet owner", role == "owner", Modifier.weight(1f)) { role = "owner" }
                    RolePill("Dog walker", role == "walker", Modifier.weight(1f)) { role = "walker" }
                }
                Spacer(Modifier.height(14.dp))
                AuthField(label = "Name", value = name, onValueChange = { name = it })
                Spacer(Modifier.height(14.dp))
            }
            AuthField(
                label = "Email", value = email, onValueChange = { email = it },
                keyboardType = KeyboardType.Email,
            )
            Spacer(Modifier.height(14.dp))
            AuthField(
                label = "Password", value = password, onValueChange = { password = it },
                keyboardType = KeyboardType.Password, isPassword = true,
            )

            val errorText = validationError ?: serverError
            if (errorText != null) {
                MonoText(
                    errorText, Color(0xFFC0392B), sizeSp = 10f,
                    weight = FontWeight.Normal, trackingEm = 0.04f, upper = false,
                    modifier = Modifier.padding(top = 14.dp),
                )
            }

            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(top = 26.dp)
                    .height(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(c.accent)
                    .clickable(enabled = !loading) { submit() },
                horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
            ) {
                if (loading) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = c.onInverse, strokeWidth = 2.dp)
                } else {
                    DmText(if (isSignup) "Sign up" else "Log in", c.onInverse, sizeSp = 14f, weight = FontWeight.SemiBold)
                }
            }

            Row(
                Modifier.fillMaxWidth().padding(top = 20.dp),
                horizontalArrangement = Arrangement.Center,
            ) {
                MonoText(
                    if (isSignup) "Have an account?" else "New here?",
                    c.ink.copy(alpha = 0.5f), sizeSp = 10f, weight = FontWeight.Normal, upper = false,
                )
                Spacer(Modifier.width(6.dp))
                MonoText(
                    if (isSignup) "Log in" else "Sign up", c.accent, sizeSp = 10f, weight = FontWeight.SemiBold,
                    upper = false,
                    modifier = Modifier.clickable(enabled = !loading) {
                        isSignup = !isSignup
                        validationError = null
                    },
                )
            }
        }
    }
}

@Composable
private fun RolePill(label: String, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val c = Hud.colors
    Box(
        modifier.height(40.dp).clip(RoundedCornerShape(10.dp))
            .background(if (selected) c.accent else Color.Transparent)
            .border(1.dp, if (selected) Color.Transparent else c.ink.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) {
        DmText(label, if (selected) c.onInverse else c.ink, sizeSp = 13f,
            weight = if (selected) FontWeight.SemiBold else FontWeight.Normal)
    }
}

@Composable
private fun AuthField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
) {
    val c = Hud.colors
    Column {
        MonoText(label, c.ink.copy(alpha = 0.55f), sizeSp = 9.5f, trackingEm = 0.1f)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
            singleLine = true,
            textStyle = TextStyle(fontFamily = DMSans, color = c.ink),
            visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = c.accent,
                unfocusedBorderColor = c.ink.copy(alpha = 0.18f),
                cursorColor = c.accent,
                focusedContainerColor = c.canvasDeep.copy(alpha = 0.4f),
                unfocusedContainerColor = c.canvasDeep.copy(alpha = 0.4f),
            ),
        )
    }
}

private fun validate(email: String, password: String, name: String, isSignup: Boolean): String? {
    if (isSignup && name.isBlank()) return "Enter your name"
    if (email.isBlank()) return "Enter your email"
    if (!email.contains("@") || !email.contains(".")) return "Enter a valid email"
    if (password.length < 8) return "Password must be at least 8 characters"
    return null
}
