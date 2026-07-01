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

enum UserRole: String, Codable {
    case owner, walker
}

struct User: Codable, Identifiable, Hashable {
    let id: String
    let email: String
    let name: String
    let role: UserRole
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, name, role
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
    let role: String
}

struct Pet: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let breed: String
    let ageYears: Double?
    let weightKg: Double?
    let notes: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, breed, notes
        case ageYears = "age_years"
        case weightKg = "weight_kg"
        case createdAt = "created_at"
    }

    var subtitle: String {
        [breed.isEmpty ? nil : breed,
         ageYears.map { "\(Int($0)) yrs" },
         weightKg.map { String(format: "%.1f kg", $0) }]
            .compactMap { $0 }.joined(separator: " · ")
    }
}

struct CreatePetRequest: Codable {
    let name: String
    let breed: String
    let ageYears: Double?
    let weightKg: Double?
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case name, breed, notes
        case ageYears = "age_years"
        case weightKg = "weight_kg"
    }
}

struct WalkerProfileUpdate: Codable {
    let bio: String?
    let pricePer30MinCents: Int?
    let neighborhoods: [String]?

    enum CodingKeys: String, CodingKey {
        case bio, neighborhoods
        case pricePer30MinCents = "price_per_30min_cents"
    }
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

// MARK: - AI assistant (mirrors docs/API-CONTRACT.md)

struct AssistantChatRequest: Codable {
    let message: String
}

struct DraftBooking: Codable, Hashable {
    let walkerID: String
    let dogName: String?
    let startTime: Date?
    let durationMinutes: Int

    enum CodingKeys: String, CodingKey {
        case walkerID = "walker_id"
        case dogName = "dog_name"
        case startTime = "start_time"
        case durationMinutes = "duration_minutes"
    }
}

struct AssistantReply: Codable {
    let reply: String
    let suggestedWalkers: [String]
    let draftBooking: DraftBooking?

    enum CodingKeys: String, CodingKey {
        case reply
        case suggestedWalkers = "suggested_walkers"
        case draftBooking = "draft_booking"
    }
}
