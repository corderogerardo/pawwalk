import Foundation
import Observation

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
}
