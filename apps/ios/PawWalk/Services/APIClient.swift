import Foundation

enum APIError: Error {
    /// Signup with an email that's already registered (backend returns 409).
    case emailTaken
}

/// Tiny async/await HTTP client for the PawWalk backend.
///
/// Learning note: `async`/`await` + `URLSession.data(for:)` is the modern way to
/// do networking in Swift — no completion handlers, no callback pyramids.
///
/// `APIClient` is a class (not a struct) because it holds the current bearer
/// token as mutable state — `AuthSession` sets it after login/signup/restore,
/// and every authorized request reads it back. `@MainActor` because every
/// caller (the view models) is already main-actor isolated, and it keeps
/// `bearerToken` race-free under Swift 6 strict concurrency without needing
/// a separate actor or locks for a single mutable property.
@MainActor
final class APIClient {
    static let shared = APIClient()

    /// The iOS Simulator shares the Mac's network, so localhost reaches the
    /// backend started with `uv run fastapi dev`.
    var baseURL = URL(string: "http://localhost:8000")!

    /// Set by `AuthSession` on login/signup/restore, cleared on logout.
    /// `APIClient` doesn't persist this itself — `TokenStore` (Keychain) owns
    /// persistence; this is just the in-memory copy used to stamp requests.
    var bearerToken: String?

    /// Posted when any request comes back 401, so `AuthSession` can log the
    /// user out without `APIClient` needing to know about `AuthSession`.
    static let unauthorizedNotification = Notification.Name("APIClient.unauthorized")

    private var decoder: JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }

    private var encoder: JSONEncoder {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }

    func walkers() async throws -> [Walker] {
        try await get([Walker].self, path: "walkers")
    }

    // MARK: - Auth

    func signup(email: String, password: String, name: String) async throws -> AuthResponse {
        try await post(path: "auth/signup", body: SignupRequest(email: email, password: password, name: name))
    }

    func login(email: String, password: String) async throws -> AuthResponse {
        try await post(path: "auth/login", body: LoginRequest(email: email, password: password))
    }

    func me() async throws -> User {
        try await get(User.self, path: "auth/me", authorized: true)
    }

    // MARK: - Bookings

    func createBooking(_ request: CreateBookingRequest) async throws -> Booking {
        try await post(path: "bookings", body: request, authorized: true)
    }

    func bookings() async throws -> [Booking] {
        try await get([Booking].self, path: "bookings", authorized: true)
    }

    func cancelBooking(id: String) async throws -> Booking {
        try await postEmptyBody(Booking.self, path: "bookings/\(id)/cancel", authorized: true)
    }

    // MARK: - Payments

    func createPaymentIntent(bookingID: String) async throws -> PaymentIntentResponse {
        try await post(path: "payments/intent", body: PaymentIntentRequest(bookingID: bookingID), authorized: true)
    }

    // MARK: - Request helpers

    private func get<Response: Decodable>(
        _ type: Response.Type, path: String, authorized: Bool = false
    ) async throws -> Response {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        if authorized { attachAuthorization(to: &request) }
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response)
        return try decoder.decode(Response.self, from: data)
    }

    /// Generic POST helper — encodes `body`, decodes `Response`. Signup/login
    /// don't need a token, but everything else under `/bookings` etc. does, so
    /// callers pass `authorized: true` when they need the bearer header.
    private func post<Body: Encodable, Response: Decodable>(
        path: String, body: Body, authorized: Bool = false
    ) async throws -> Response {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        if authorized { attachAuthorization(to: &request) }
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response)
        return try decoder.decode(Response.self, from: data)
    }

    /// POST with no request body (e.g. `/bookings/{id}/cancel`).
    private func postEmptyBody<Response: Decodable>(
        _ type: Response.Type, path: String, authorized: Bool = false
    ) async throws -> Response {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        if authorized { attachAuthorization(to: &request) }
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response)
        return try decoder.decode(Response.self, from: data)
    }

    private func attachAuthorization(to request: inout URLRequest) {
        guard let bearerToken else { return }
        request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
    }

    private func checkStatus(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        if http.statusCode == 401 {
            NotificationCenter.default.post(name: Self.unauthorizedNotification, object: nil)
        }
        switch http.statusCode {
        case 200..<300: return
        case 409: throw APIError.emailTaken
        default: throw URLError(.badServerResponse)
        }
    }
}
