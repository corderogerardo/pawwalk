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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pawwalk.android.data.Walker
import com.pawwalk.android.ui.components.DmText
import com.pawwalk.android.ui.components.MonoText
import com.pawwalk.android.ui.components.PawIcon
import com.pawwalk.android.ui.theme.BrandColors
import com.pawwalk.android.ui.theme.Hud

/**
 * AI booking assistant chat. Suggested walkers appear as tappable chips that
 * jump into the booking form — the full ask→book loop (docs/FUNCTIONAL-REVIEW.md N6).
 */
@Composable
fun AssistantScreen(onClose: () -> Unit, onBook: (Walker) -> Unit, viewModel: AssistantViewModel = viewModel()) {
    val c = Hud.colors
    val messages by viewModel.messages.collectAsState()
    val sending by viewModel.sending.collectAsState()
    val listState = rememberLazyListState()
    var draft by remember { mutableStateOf("") }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    Column(Modifier.fillMaxSize().background(c.canvas).statusBarsPadding()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            MonoText("← Back", c.ink.copy(alpha = 0.6f), modifier = Modifier.clickable { onClose() })
            Spacer(Modifier.weight(1f))
            MonoText("Assistant", c.accent)
            Spacer(Modifier.weight(1f))
            Spacer(Modifier.width(40.dp))
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            itemsIndexed(messages) { _, message ->
                MessageBubble(c, message, onBook)
            }
            if (sending) {
                item {
                    Box(Modifier.padding(6.dp)) { CircularProgressIndicator(color = c.accent, strokeWidth = 2.dp) }
                }
            }
        }

        Row(
            Modifier.fillMaxWidth().imePadding().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedTextField(
                value = draft,
                onValueChange = { draft = it },
                modifier = Modifier.weight(1f),
                placeholder = { DmText("Ask for a walker…", c.ink.copy(alpha = 0.4f), sizeSp = 14f) },
                textStyle = LocalTextStyle.current.copy(color = c.ink, fontSize = 14.sp),
                shape = RoundedCornerShape(24.dp),
                singleLine = false,
                maxLines = 4,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = c.accent.copy(alpha = 0.6f),
                    unfocusedBorderColor = c.ink.copy(alpha = 0.18f),
                    cursorColor = c.accent,
                ),
            )
            val canSend = draft.isNotBlank() && !sending
            Box(
                Modifier.size(46.dp).clip(RoundedCornerShape(50))
                    .background(if (canSend) c.accent else c.accent.copy(alpha = 0.4f))
                    .clickable(enabled = canSend) {
                        val text = draft
                        draft = ""
                        viewModel.send(text)
                    },
                contentAlignment = Alignment.Center,
            ) {
                DmText("↑", c.onInverse, sizeSp = 20f, weight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun MessageBubble(c: BrandColors, message: AssistantViewModel.Message, onBook: (Walker) -> Unit) {
    Column(
        Modifier.fillMaxWidth(),
        horizontalAlignment = if (message.fromUser) Alignment.End else Alignment.Start,
    ) {
        Box(
            Modifier.clip(RoundedCornerShape(14.dp))
                .background(if (message.fromUser) c.accent else c.canvasDeep)
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            DmText(message.text, if (message.fromUser) c.onInverse else c.ink, sizeSp = 14f)
        }
        message.walkers.forEach { walker ->
            Spacer(Modifier.height(6.dp))
            Row(
                Modifier.fillMaxWidth().height(44.dp).clip(RoundedCornerShape(12.dp))
                    .border(1.dp, c.accent.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .clickable { onBook(walker) }.padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                PawIcon(c.ink, size = 14.dp)
                Spacer(Modifier.width(8.dp))
                DmText(walker.name, c.ink, sizeSp = 13f, weight = FontWeight.SemiBold)
                Spacer(Modifier.width(8.dp))
                MonoText("★ %.1f".format(walker.rating), c.ink.copy(alpha = 0.6f), sizeSp = 11f, upper = false)
                Spacer(Modifier.weight(1f))
                MonoText("Book", c.accent, sizeSp = 11f, weight = FontWeight.SemiBold, upper = false)
            }
        }
    }
}
