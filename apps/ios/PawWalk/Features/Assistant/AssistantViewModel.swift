import Foundation
import Observation

/// Drives the AI booking assistant screen. Calls `POST /assistant/chat`
/// (LangGraph + heuristic intent parser on the backend) and keeps a simple
/// transcript. Resolves suggested walker IDs to names via `/walkers`.
@MainActor
@Observable
final class AssistantViewModel {
    struct Message: Identifiable {
        let id = UUID()
        let fromUser: Bool
        let text: String
        /// Walkers the assistant suggested for this reply (resolved to real records).
        var walkers: [Walker] = []
    }

    private(set) var messages: [Message] = [
        Message(fromUser: false,
                text: "Hi! Tell me where and when you need a walk — e.g. \"a walker in the Mission for my husky tomorrow at 3pm\".")
    ]
    private(set) var isSending = false

    private var walkersByID: [String: Walker] = [:]

    func loadWalkers() async {
        guard walkersByID.isEmpty else { return }
        let walkers = (try? await APIClient.shared.walkers()) ?? []
        walkersByID = Dictionary(uniqueKeysWithValues: walkers.map { ($0.id, $0) })
    }

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isSending else { return }
        messages.append(Message(fromUser: true, text: trimmed))
        isSending = true
        defer { isSending = false }
        do {
            let reply = try await APIClient.shared.assistantChat(message: trimmed)
            let walkers = reply.suggestedWalkers.compactMap { walkersByID[$0] }
            messages.append(Message(fromUser: false, text: reply.reply, walkers: walkers))
        } catch {
            messages.append(Message(fromUser: false,
                                    text: "Sorry — I couldn't reach the assistant. Try again."))
        }
    }
}
