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

    /// Walk hasn't happened yet or is happening now (excludes completed and cancelled).
    var isActive: Bool { self == .pending || self == .confirmed || self == .inProgress }
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

// MARK: - Owner home stats (GET /bookings/stats)

struct RecentWalk: Codable, Identifiable, Hashable {
    let bookingID: String
    let dogName: String
    let walkerName: String
    let startTime: Date
    let durationMinutes: Int
    let distanceKm: Double
    /// Per-segment distance profile of the recorded track, 6 values in 0...1
    /// (empty when the walk had no GPS track). Drives the sparkline.
    let sparkline: [Double]

    var id: String { bookingID }

    enum CodingKeys: String, CodingKey {
        case sparkline
        case bookingID = "booking_id"
        case dogName = "dog_name"
        case walkerName = "walker_name"
        case startTime = "start_time"
        case durationMinutes = "duration_minutes"
        case distanceKm = "distance_km"
    }
}

struct OwnerStats: Codable {
    let distanceKm: Double
    let streakDays: Int
    let recentWalks: [RecentWalk]

    enum CodingKeys: String, CodingKey {
        case distanceKm = "distance_km"
        case streakDays = "streak_days"
        case recentWalks = "recent_walks"
    }
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
