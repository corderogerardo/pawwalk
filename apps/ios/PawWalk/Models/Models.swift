import Foundation

/// Mirrors docs/API-CONTRACT.md. Explicit CodingKeys map the snake_case JSON
/// from the backend to idiomatic Swift property names.
struct Walker: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let photoURL: String?
    let rating: Double
    let pricePer30MinCents: Int
    let bio: String
    let neighborhoods: [String]

    enum CodingKeys: String, CodingKey {
        case id, name, rating, bio, neighborhoods
        case photoURL = "photo_url"
        case pricePer30MinCents = "price_per_30min_cents"
    }

    var priceLabel: String { "$\(pricePer30MinCents / 100) / 30 min" }
}

extension Walker {
    /// Shown when the backend isn't running, so the app is never empty.
    static let samples: [Walker] = [
        Walker(id: "wlk_sam", name: "Sam Rivera", photoURL: nil, rating: 4.9,
               pricePer30MinCents: 1800, bio: "10 yrs with dogs. Loves huskies.",
               neighborhoods: ["Mission", "SoMa"]),
        Walker(id: "wlk_ari", name: "Ari Chen", photoURL: nil, rating: 4.8,
               pricePer30MinCents: 2000, bio: "Certified trainer. Great with reactive dogs.",
               neighborhoods: ["Mission", "Noe Valley"]),
        Walker(id: "wlk_jo", name: "Jo Park", photoURL: nil, rating: 4.7,
               pricePer30MinCents: 1600, bio: "Marathoner — your pup will be tired and happy.",
               neighborhoods: ["SoMa", "Dogpatch"]),
    ]
}

struct User: Codable, Identifiable, Hashable {
    let id: String
    let email: String
    let name: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, name
        case createdAt = "created_at"
    }
}

struct AuthResponse: Codable {
    let accessToken: String
    let tokenType: String
    let user: User

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case user
    }
}

struct SignupRequest: Codable {
    let email: String
    let password: String
    let name: String
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct CreateBookingRequest: Codable {
    let walkerID: String
    let dogName: String
    let startTime: Date
    let durationMinutes: Int
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case notes
        case walkerID = "walker_id"
        case dogName = "dog_name"
        case startTime = "start_time"
        case durationMinutes = "duration_minutes"
    }
}

enum BookingStatus: String, Codable {
    case pending, confirmed, inProgress = "in_progress", completed, cancelled
}

struct Booking: Codable, Identifiable, Hashable {
    let id: String
    let walkerID: String
    let dogName: String
    let startTime: Date
    let durationMinutes: Int
    let status: BookingStatus
    let priceCents: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, status
        case walkerID = "walker_id"
        case dogName = "dog_name"
        case startTime = "start_time"
        case durationMinutes = "duration_minutes"
        case priceCents = "price_cents"
        case createdAt = "created_at"
    }

    var priceLabel: String { "$\(priceCents / 100)" }
}

struct PaymentIntentRequest: Codable {
    let bookingID: String

    enum CodingKeys: String, CodingKey {
        case bookingID = "booking_id"
    }
}

struct PaymentIntentResponse: Codable {
    let clientSecret: String
    let amountCents: Int

    enum CodingKeys: String, CodingKey {
        case clientSecret = "client_secret"
        case amountCents = "amount_cents"
    }
}
