import Foundation

enum APIError: Error, LocalizedError {
    /// Signup with an email that's already registered (backend returns 409).
    case emailTaken
    /// Backend returned an error with a server-provided message.
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .emailTaken: return "That email is already registered. Try logging in instead."
        case .serverError(let detail): return detail
        }
    }
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
        d.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let string = try container.decode(String.self)
            // Try ISO8601 with timezone + fractional seconds, then without fractional
            let iso = ISO8601DateFormatter()
            iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso.date(from: string) { return date }
            iso.formatOptions = .withInternetDateTime
            if let date = iso.date(from: string) { return date }
            // Backend's SQLite loses timezone — try appending Z
            let withZ = string + "Z"
            iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso.date(from: withZ) { return date }
            iso.formatOptions = .withInternetDateTime
            if let date = iso.date(from: withZ) { return date }
            // Last resort: DateFormatter handles any fractional digit count
            let df = DateFormatter()
            df.locale = Locale(identifier: "en_US_POSIX")
            df.timeZone = TimeZone(secondsFromGMT: 0)
            for fmt in ["yyyy-MM-dd'T'HH:mm:ss.SSSSSS", "yyyy-MM-dd'T'HH:mm:ss.SSS", "yyyy-MM-dd'T'HH:mm:ss"] {
                df.dateFormat = fmt
                if let date = df.date(from: string) { return date }
                if let date = df.date(from: string + "Z") { return date }
            }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid date: \(string)")
        }
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

    func signup(email: String, password: String, name: String, role: UserRole) async throws -> AuthResponse {
        try await post(path: "auth/signup",
                       body: SignupRequest(email: email, password: password, name: name, role: role.rawValue))
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

    /// Real Home-screen numbers: tracked distance, walk streak, recent walks.
    func ownerStats() async throws -> OwnerStats {
        try await get(OwnerStats.self, path: "bookings/stats", authorized: true)
    }

    // MARK: - Pets (owner)

    func pets() async throws -> [Pet] {
        try await get([Pet].self, path: "pets", authorized: true)
    }

    func createPet(_ request: CreatePetRequest) async throws -> Pet {
        try await post(path: "pets", body: request, authorized: true)
    }

    func deletePet(id: String) async throws {
        try await delete(path: "pets/\(id)", authorized: true)
    }

    // MARK: - Walker workflow

    func walkerProfile() async throws -> Walker {
        try await get(Walker.self, path: "walkers/me", authorized: true)
    }

    func updateWalkerProfile(_ update: WalkerProfileUpdate) async throws -> Walker {
        try await patch(path: "walkers/me", body: update, authorized: true)
    }

    func assignedBookings() async throws -> [Booking] {
        try await get([Booking].self, path: "bookings/assigned", authorized: true)
    }

    /// action ∈ accept | decline | start | complete
    func transitionBooking(id: String, action: String) async throws -> Booking {
        try await postEmptyBody(Booking.self, path: "bookings/\(id)/\(action)", authorized: true)
    }

    // MARK: - Assistant

    func assistantChat(message: String) async throws -> AssistantReply {
        try await post(path: "assistant/chat", body: AssistantChatRequest(message: message), authorized: true)
    }

    // MARK: - Live tracking

    /// Demo helper — asks the backend to replay a walking route into the live
    /// channel (see /bookings/{id}/simulate). Response body is ignored.
    func simulateWalk(bookingID: String) async throws {
        struct Ack: Decodable {}
        _ = try await postEmptyBody(Ack.self, path: "bookings/\(bookingID)/simulate", authorized: true)
    }

    // MARK: - Request helpers

    private func get<Response: Decodable>(
        _ type: Response.Type, path: String, authorized: Bool = false
    ) async throws -> Response {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        if authorized { attachAuthorization(to: &request) }
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response, data: data)
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
        try checkStatus(response, data: data)
        return try decoder.decode(Response.self, from: data)
    }

    private func patch<Body: Encodable, Response: Decodable>(
        path: String, body: Body, authorized: Bool = false
    ) async throws -> Response {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        if authorized { attachAuthorization(to: &request) }
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response, data: data)
        return try decoder.decode(Response.self, from: data)
    }

    /// DELETE — expects 2xx (e.g. 204), decodes nothing.
    private func delete(path: String, authorized: Bool = false) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "DELETE"
        if authorized { attachAuthorization(to: &request) }
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response, data: data)
    }

    /// POST with no request body (e.g. `/bookings/{id}/cancel`).
    private func postEmptyBody<Response: Decodable>(
        _ type: Response.Type, path: String, authorized: Bool = false
    ) async throws -> Response {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        if authorized { attachAuthorization(to: &request) }
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response, data: data)
        return try decoder.decode(Response.self, from: data)
    }

    private func attachAuthorization(to request: inout URLRequest) {
        guard let bearerToken else { return }
        request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
    }

    private struct ServerError: Decodable {
        let detail: String
    }

    private func checkStatus(_ response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        if http.statusCode == 401 {
            NotificationCenter.default.post(name: Self.unauthorizedNotification, object: nil)
        }
        switch http.statusCode {
        case 200..<300: return
        case 409: throw APIError.emailTaken
        default:
            if let serverError = try? decoder.decode(ServerError.self, from: data) {
                throw APIError.serverError(serverError.detail)
            }
            throw URLError(.badServerResponse)
        }
    }
}
