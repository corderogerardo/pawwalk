import Foundation
import Observation

/// Backs `HomeView` with the signed-in user's real data (see
/// docs/FUNCTIONAL-REVIEW.md N3). Loads bookings + walkers and derives the
/// "next walk" and a this-week count. Distance/streak stats stay decorative —
/// the backend has no walk-telemetry yet (that's N7).
@MainActor
@Observable
final class HomeViewModel {
    private(set) var upcoming: (booking: Booking, walker: Walker?)?
    private(set) var weekCount = 0
    private(set) var pets: [Pet] = []
    private(set) var loaded = false

    func load() async {
        async let bookingsCall = APIClient.shared.bookings()
        async let walkersCall = APIClient.shared.walkers()
        async let petsCall = APIClient.shared.pets()
        let bookings = (try? await bookingsCall) ?? []
        let walkers = (try? await walkersCall) ?? Walker.samples
        pets = (try? await petsCall) ?? []
        let byID = Dictionary(uniqueKeysWithValues: walkers.map { ($0.id, $0) })

        let now = Date()
        let future = bookings
            .filter { $0.status != .cancelled && $0.startTime >= now }
            .sorted { $0.startTime < $1.startTime }

        upcoming = future.first.map { ($0, byID[$0.walkerID]) }
        let weekAhead = now.addingTimeInterval(7 * 24 * 3600)
        weekCount = future.filter { $0.startTime <= weekAhead }.count
        loaded = true
    }
}
