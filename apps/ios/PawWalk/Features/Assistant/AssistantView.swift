import SwiftUI

/// AI booking assistant — a small chat over `POST /assistant/chat`. Suggested
/// walkers surface as tappable chips that open the booking form, closing the
/// loop from "ask" to "book" (see docs/FUNCTIONAL-REVIEW.md N6).
struct AssistantView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var model = AssistantViewModel()
    @State private var draft = ""
    @State private var bookingWalker: Walker?

    var body: some View {
        NavigationStack {
            ZStack {
                Brand.canvas.ignoresSafeArea()
                VStack(spacing: 0) {
                    transcript
                    inputBar
                }
            }
            .navigationTitle("Assistant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .task { await model.loadWalkers() }
            .sheet(item: $bookingWalker) { walker in
                CreateBookingView(walker: walker) { _ in bookingWalker = nil }
            }
        }
    }

    private var transcript: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(model.messages) { message in
                        bubble(message).id(message.id)
                    }
                    if model.isSending {
                        ProgressView().padding(.leading, 4)
                    }
                }
                .padding(16)
            }
            .onChange(of: model.messages.count) {
                if let last = model.messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
            }
        }
    }

    @ViewBuilder
    private func bubble(_ message: AssistantViewModel.Message) -> some View {
        VStack(alignment: message.fromUser ? .trailing : .leading, spacing: 6) {
            Text(message.text)
                .font(.dm(14))
                .foregroundStyle(message.fromUser ? Brand.onInverse : Brand.ink)
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(message.fromUser ? Brand.accent : Brand.canvasDeep)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            if !message.walkers.isEmpty {
                ForEach(message.walkers) { walker in
                    Button { bookingWalker = walker } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "pawprint.fill").font(.system(size: 12))
                            Text(walker.name).font(.dm(13, .semibold))
                            Text(String(format: "★ %.1f", walker.rating)).font(.mono(11))
                            Spacer()
                            Text("Book").font(.dm(12, .semibold)).foregroundStyle(Brand.accent)
                        }
                        .foregroundStyle(Brand.ink)
                        .padding(.horizontal, 12).frame(height: 44)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Brand.accent.opacity(0.4), lineWidth: 1))
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: message.fromUser ? .trailing : .leading)
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Ask for a walker…", text: $draft, axis: .vertical)
                .font(.dm(14))
                .textFieldStyle(.plain)
                .padding(.horizontal, 14).padding(.vertical, 10)
                .overlay(Capsule().stroke(Brand.ink.opacity(0.18), lineWidth: 1))
            Button {
                let text = draft
                draft = ""
                Task { await model.send(text) }
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Brand.onInverse)
                    .frame(width: 42, height: 42)
                    .background(Brand.accent, in: Circle())
            }
            .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || model.isSending)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Brand.canvas)
    }
}

#Preview {
    AssistantView()
}
