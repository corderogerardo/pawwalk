import Foundation
import Observation

/// View model for the Walkers screen.
///
/// `@Observable` (the Observation framework, iOS 17+) is the modern replacement
/// for `ObservableObject` + `@Published` — SwiftUI tracks exactly which
/// properties a view reads and re-renders only when those change.
@MainActor
@Observable
final class WalkersViewModel {
    enum ViewState {
        case loading
        case loaded([Walker])
        case failed(String)
    }

    private(set) var state: ViewState = .loading

    func load() async {
        state = .loading
        do {
            let walkers = try await APIClient.shared.walkers()
            state = .loaded(walkers)
        } catch {
            // Backend not running yet? Fall back to samples so the app still works.
            state = .loaded(Walker.samples)
        }
    }
}
