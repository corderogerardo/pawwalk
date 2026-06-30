import Foundation
import Observation
import StripePaymentSheet

/// View model for the Bookings screen. Same `@Observable` + `ViewState` shape
/// as `WalkersViewModel`.
@MainActor
@Observable
final class BookingsViewModel {
    enum ViewState {
        case loading
        case loaded([Booking])
        case failed(String)
    }

    private(set) var state: ViewState = .loading

    /// Set once `/payments/intent` returns, so the view can present
    /// `PaymentSheet`. `nil` means no sheet to show.
    var paymentSheet: PaymentSheet?
    var paymentErrorMessage: String?

    func load() async {
        state = .loading
        do {
            let bookings = try await APIClient.shared.bookings()
            state = .loaded(bookings.sorted { $0.startTime > $1.startTime })
        } catch {
            state = .failed("Couldn't load your bookings. Pull to refresh to try again.")
        }
    }

    func cancel(_ booking: Booking) async {
        guard case .loaded(var bookings) = state else { return }
        do {
            let updated = try await APIClient.shared.cancelBooking(id: booking.id)
            if let index = bookings.firstIndex(where: { $0.id == updated.id }) {
                bookings[index] = updated
            }
            state = .loaded(bookings)
        } catch {
            // Leave the list as-is — the row's cancel button is still available to retry.
        }
    }

    /// Fetches the PaymentIntent client secret for `booking` and builds a
    /// `PaymentSheet`. The view watches `paymentSheet` and presents it once set.
    func pay(_ booking: Booking) async {
        paymentErrorMessage = nil
        do {
            let intent = try await APIClient.shared.createPaymentIntent(bookingID: booking.id)
            var config = PaymentSheet.Configuration()
            config.merchantDisplayName = "PawWalk"
            paymentSheet = PaymentSheet(paymentIntentClientSecret: intent.clientSecret, configuration: config)
        } catch {
            paymentErrorMessage = "Couldn't start payment. Try again."
        }
    }
}
