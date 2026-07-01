package com.pawwalk.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pawwalk.android.data.AssistantChatRequest
import com.pawwalk.android.data.Network
import com.pawwalk.android.data.Walker
import com.pawwalk.android.data.WalkerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Drives the AI booking assistant screen over POST /assistant/chat (mirrors the
 * iOS AssistantViewModel — see docs/FUNCTIONAL-REVIEW.md N6). Resolves suggested
 * walker IDs to real records so the UI can offer "book this walker".
 */
class AssistantViewModel : ViewModel() {
    data class Message(val fromUser: Boolean, val text: String, val walkers: List<Walker> = emptyList())

    private val _messages = MutableStateFlow(
        listOf(
            Message(
                false,
                "Hi! Tell me where and when you need a walk — e.g. \"a walker in the Mission for my husky tomorrow at 3pm\".",
            )
        )
    )
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _sending = MutableStateFlow(false)
    val sending: StateFlow<Boolean> = _sending.asStateFlow()

    private var walkersById: Map<String, Walker> = emptyMap()

    fun send(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || _sending.value) return
        _messages.value = _messages.value + Message(fromUser = true, text = trimmed)
        viewModelScope.launch {
            _sending.value = true
            try {
                if (walkersById.isEmpty()) walkersById = WalkerRepository.fetchWalkers().associateBy { it.id }
                val reply = Network.api.assistantChat(AssistantChatRequest(trimmed))
                val walkers = reply.suggestedWalkers.mapNotNull { walkersById[it] }
                _messages.value = _messages.value + Message(false, reply.reply, walkers)
            } catch (e: Exception) {
                _messages.value = _messages.value + Message(false, "Sorry — I couldn't reach the assistant. Try again.")
            } finally {
                _sending.value = false
            }
        }
    }
}
