import StripePaymentSheet
import SwiftUI

struct BookingsView: View {
    @State private var model = BookingsViewModel()

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Bookings")
                .task { await model.load() }
                .paymentSheet(
                    isPresented: Binding(
                        get: { model.paymentSheet != nil },
                        set: { if !$0 { model.paymentSheet = nil } }
                    ),
                    paymentSheet: model.paymentSheet ?? PaymentSheet(paymentIntentClientSecret: "", configuration: .init()),
                    onCompletion: { result in
                        model.paymentSheet = nil
                        if case .completed = result {
                            Task { await model.load() }
                        }
                    }
                )
        }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .loading:
            ProgressView("Loading bookings…")
        case .failed(let message):
            ContentUnavailableView {
                Label("Couldn't load bookings", systemImage: "exclamationmark.triangle")
            } description: {
                Text(message)
            }
        case .loaded(let bookings) where bookings.isEmpty:
            ContentUnavailableView {
                Label("No bookings yet", systemImage: "calendar.badge.plus")
            } description: {
                Text("Book a walk from the Walkers tab and it'll show up here.")
            }
        case .loaded(let bookings):
            List(bookings) { booking in
                BookingRow(booking: booking) {
                    Task { await model.cancel(booking) }
                } onPay: {
                    Task { await model.pay(booking) }
                }
            }
            .listStyle(.plain)
            .refreshable { await model.load() }
        }
    }
}

private struct BookingRow: View {
    let booking: Booking
    var onCancel: () -> Void
    var onPay: () -> Void

    private var canCancel: Bool {
        booking.status == .pending || booking.status == .confirmed
    }

    private var canPay: Bool {
        booking.status == .pending
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(booking.dogName).font(.dm(15, .semibold)).foregroundStyle(Brand.ink)
                Spacer()
                StatusBadge(status: booking.status)
            }
            MonoCaption(booking.startTime.formatted(date: .abbreviated, time: .shortened),
                        size: 10, weight: .regular, tracking: 0.07, color: Brand.ink.opacity(0.6))
            HStack {
                Text("\(booking.durationMinutes) min").font(.mono(11)).foregroundStyle(Brand.ink.opacity(0.6))
                Spacer()
                Text(booking.priceLabel).font(.mono(13, .semibold)).foregroundStyle(Brand.ink)
            }
            if canPay || canCancel {
                HStack(spacing: 16) {
                    if canPay {
                        Button(action: onPay) {
                            Text("Pay").font(.dm(12, .semibold))
                        }
                        .tint(Brand.accent)
                    }
                    if canCancel {
                        Button(role: .destructive, action: onCancel) {
                            Text("Cancel").font(.dm(12, .semibold))
                        }
                    }
                }
                .padding(.top, 2)
            }
        }
        .padding(.vertical, 6)
    }
}

private struct StatusBadge: View {
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
        Text(status.rawValue.uppercased())
            .font(.mono(8.5)).tracking(0.6)
            .foregroundStyle(color)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .overlay(Capsule().stroke(color.opacity(0.5), lineWidth: 1))
    }
}

#Preview {
    BookingsView()
}
