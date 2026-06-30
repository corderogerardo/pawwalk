import Foundation
import Observation

/// Owns the signed-in user and drives the auth lifecycle. Same `@Observable`
/// view-model pattern as `WalkersViewModel` — SwiftUI re-renders only the
/// views that read `currentUser`/`signedIn`.
@MainActor
@Observable
final class AuthSession {
    private(set) var currentUser: User?
    private(set) var isRestoring = true
    var errorMessage: String?

    var signedIn: Bool { currentUser != nil }

    init() {
        // A 401 on any authorized request (e.g. an expired token on a
        // booking call) means the session is no longer valid — log out.
        NotificationCenter.default.addObserver(
            forName: APIClient.unauthorizedNotification, object: nil, queue: .main
        ) { [weak self] _ in
            self?.logOut()
        }
    }

    /// Called once on launch. Reads any saved token, hands it to `APIClient`,
    /// then confirms it's still valid via `/auth/me`. A 401 (expired/revoked
    /// token) just clears it silently — back to the signed-out state.
    func restore() async {
        defer { isRestoring = false }
        guard let token = TokenStore.read() else { return }
        APIClient.shared.bearerToken = token
        do {
            currentUser = try await APIClient.shared.me()
        } catch {
            TokenStore.clear()
            APIClient.shared.bearerToken = nil
        }
    }

    func signUp(email: String, password: String, name: String) async {
        await authenticate { try await APIClient.shared.signup(email: email, password: password, name: name) }
    }

    func logIn(email: String, password: String) async {
        await authenticate { try await APIClient.shared.login(email: email, password: password) }
    }

    func logOut() {
        TokenStore.clear()
        APIClient.shared.bearerToken = nil
        currentUser = nil
    }

    private func authenticate(_ request: () async throws -> AuthResponse) async {
        errorMessage = nil
        do {
            let auth = try await request()
            TokenStore.save(token: auth.accessToken)
            APIClient.shared.bearerToken = auth.accessToken
            currentUser = auth.user
        } catch APIError.emailTaken {
            errorMessage = "That email is already registered. Try logging in instead."
        } catch {
            errorMessage = "Something went wrong. Check your details and try again."
        }
    }
}
