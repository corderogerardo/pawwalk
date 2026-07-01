import SwiftUI
import Observation

@MainActor
@Observable
final class WalkerViewModel {
    enum ViewState { case loading, loaded([Booking]), failed(String) }
    private(set) var state: ViewState = .loading
    private(set) var profile: Walker?

    func load() async {
        state = .loading
        async let bookingsCall = APIClient.shared.assignedBookings()
        async let profileCall = APIClient.shared.walkerProfile()
        profile = try? await profileCall
        if let bookings = try? await bookingsCall {
            state = .loaded(bookings.sorted { $0.startTime < $1.startTime })
        } else {
            state = .failed("Couldn't load your walks. Pull to refresh.")
        }
    }

    func act(_ booking: Booking, _ action: String) async {
        _ = try? await APIClient.shared.transitionBooking(id: booking.id, action: action)
        await load()
    }

    func updateProfile(_ update: WalkerProfileUpdate) async {
        if let updated = try? await APIClient.shared.updateWalkerProfile(update) { profile = updated }
    }
}

/// The walker experience — the walks assigned to them, with accept / start /
/// complete actions, plus a profile they can edit.
struct WalkerHomeView: View {
    @Environment(AuthSession.self) private var auth
    @State private var model = WalkerViewModel()
    @State private var showEdit = false
    @State private var trackingWalk: Booking?

    var body: some View {
        NavigationStack {
            ZStack {
                Brand.canvas.ignoresSafeArea()
                content
            }
            .navigationTitle("Your walks")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { showEdit = true } label: { Image(systemName: "person.text.rectangle") }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button { auth.logOut() } label: { Image(systemName: "rectangle.portrait.and.arrow.right") }
                }
            }
            .task { await model.load() }
            .sheet(isPresented: $showEdit) {
                WalkerProfileEditView(profile: model.profile) { update in
                    Task { await model.updateProfile(update); showEdit = false }
                }
            }
            .fullScreenCover(item: $trackingWalk) { walk in
                LiveTrackingView(bookingID: walk.id, dogName: walk.dogName)
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .loading:
            ProgressView("Loading walks…")
        case .failed(let message):
            ContentUnavailableView("Couldn't load walks", systemImage: "exclamationmark.triangle", description: Text(message))
        case .loaded(let bookings):
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    profileCard
                    if bookings.isEmpty {
                        MonoCaption("No walks assigned yet. Owners will book you from your profile.",
                                    size: 11, weight: .regular, tracking: 0.05, color: Brand.ink.opacity(0.6))
                            .padding(.top, 8)
                    } else {
                        ForEach(bookings) { booking in
                            WalkRow(booking: booking,
                                    onAction: { action in Task { await model.act(booking, action) } },
                                    onTrack: { trackingWalk = booking })
                        }
                    }
                }
                .padding(20)
            }
            .refreshable { await model.load() }
        }
    }

    private var profileCard: some View {
        VStack(alignment: .leading, spacing: 4) {
            MonoCaption("PawWalk · Walker", color: Brand.accent)
            Text(auth.currentUser?.name ?? "Walker").font(.dm(28, .medium)).tracking(-1).foregroundStyle(Brand.ink)
            if let p = model.profile {
                MonoCaption("$\(p.pricePer30MinCents / 100)/30 min · ★ \(String(format: "%.1f", p.rating))",
                            size: 10, weight: .regular, tracking: 0.06, color: Brand.ink.opacity(0.6))
                if !p.neighborhoods.isEmpty {
                    MonoCaption(p.neighborhoods.joined(separator: " · "), size: 9, weight: .regular,
                                tracking: 0.06, color: Brand.ink.opacity(0.5))
                }
            }
        }
        .padding(.bottom, 4)
        .overlay(Rectangle().fill(Brand.ink.opacity(0.12)).frame(height: 1), alignment: .bottom)
    }
}

private struct WalkRow: View {
    let booking: Booking
    var onAction: (String) -> Void
    /// Opens live GPS streaming for a walk that's underway — the walker's
    /// device feeds the owner's map.
    var onTrack: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(booking.dogName).font(.dm(15, .semibold)).foregroundStyle(Brand.ink)
                Spacer()
                WalkStatusBadge(status: booking.status)
            }
            MonoCaption(booking.startTime.formatted(date: .abbreviated, time: .shortened),
                        size: 10, weight: .regular, tracking: 0.06, color: Brand.ink.opacity(0.6))
            MonoCaption("\(booking.durationMinutes) min · \(booking.priceLabel)", size: 10, weight: .regular,
                        tracking: 0.06, color: Brand.ink.opacity(0.6))
            actions
        }
        .padding(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Brand.ink.opacity(0.12), lineWidth: 1))
    }

    @ViewBuilder
    private var actions: some View {
        HStack(spacing: 8) {
            switch booking.status {
            case .pending:
                actionButton("Accept", "accept", filled: true)
                actionButton("Decline", "decline", filled: false)
            case .confirmed:
                actionButton("Start walk", "start", filled: true)
            case .inProgress:
                Button(action: onTrack) {
                    HStack(spacing: 5) {
                        Image(systemName: "location.fill").font(.system(size: 10))
                        Text("Stream GPS").font(.dm(12, .semibold))
                    }
                    .foregroundStyle(Brand.onInverse)
                    .padding(.horizontal, 14).frame(height: 34)
                    .background(Brand.signalGreen)
                    .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                }
                actionButton("Complete", "complete", filled: true)
            case .completed, .cancelled:
                EmptyView()
            }
        }
        .padding(.top, 2)
    }

    private func actionButton(_ label: String, _ action: String, filled: Bool) -> some View {
        Button { onAction(action) } label: {
            Text(label).font(.dm(12, .semibold))
                .foregroundStyle(filled ? Brand.onInverse : Brand.ink)
                .padding(.horizontal, 14).frame(height: 34)
                .background(filled ? Brand.accent : Color.clear)
                .overlay(RoundedRectangle(cornerRadius: 9).stroke(filled ? Color.clear : Brand.ink.opacity(0.25), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
        }
    }
}

private struct WalkStatusBadge: View {
    let status: BookingStatus
    private var color: Color {
        switch status {
        case .pending: return Brand.pinAmber
        case .confirmed, .inProgress: return Brand.signalGreen
        case .completed: return Brand.accent
        case .cancelled: return Brand.ink.opacity(0.4)
        }
    }
    var body: some View {
        Text(status.rawValue.uppercased()).font(.mono(8.5)).tracking(0.6).foregroundStyle(color)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .overlay(Capsule().stroke(color.opacity(0.5), lineWidth: 1))
    }
}

private struct WalkerProfileEditView: View {
    let profile: Walker?
    var onSave: (WalkerProfileUpdate) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var bio = ""
    @State private var price = ""
    @State private var neighborhoods = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Profile") {
                    TextField("Bio", text: $bio, axis: .vertical)
                    TextField("Price per 30 min ($)", text: $price).keyboardType(.numberPad)
                    TextField("Neighborhoods (comma-separated)", text: $neighborhoods)
                }
            }
            .navigationTitle("Edit profile")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                bio = profile?.bio ?? ""
                if let cents = profile?.pricePer30MinCents { price = String(cents / 100) }
                neighborhoods = profile?.neighborhoods.joined(separator: ", ") ?? ""
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let hoods = neighborhoods.split(separator: ",")
                            .map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
                        onSave(WalkerProfileUpdate(
                            bio: bio,
                            pricePer30MinCents: Int(price).map { $0 * 100 },
                            neighborhoods: hoods
                        ))
                    }
                }
            }
        }
    }
}

#Preview { WalkerHomeView().environment(AuthSession()) }
