import Foundation
import StripePaymentSheet

/// Client-side Stripe config — separate from the backend's
/// `PAWWALK_STRIPE_SECRET_KEY`. Same "no elaborate config system" pattern as
/// `APIClient.baseURL`: a hardcoded var, no plist/env layer.
///
/// Empty string means "not configured" — `activate()` skips setting
/// `StripeAPI.defaultPublishableKey` in that case, and Payment Sheet simply
/// won't have a real key to work with (fine for this learning app; the
/// backend still returns a stub client secret either way).
enum StripeConfig {
    /// Get a real `pk_test_...` key from the Stripe dashboard to make
    /// Payment Sheet actually work.
    static let publishableKey = ""

    /// Call once at app launch, from the main actor. `StripeAPI` exposes
    /// `setDefaultPublishableKey(_:)` as an instance method specifically
    /// because the bare `defaultPublishableKey` static var isn't annotated
    /// `Sendable`/`@MainActor` and trips Swift 6 strict concurrency — going
    /// through the instance method sidesteps that without unsafe escapes.
    static func activate() {
        guard !publishableKey.isEmpty else { return }
        StripeAPI().setDefaultPublishableKey(publishableKey)
    }
}
