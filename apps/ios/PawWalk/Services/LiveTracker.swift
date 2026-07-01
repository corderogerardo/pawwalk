import CoreLocation
import Foundation
import Observation

/// Live GPS tracking client. Streams the device's real CoreLocation fixes to the
/// backend over a WebSocket and renders the aggregated track (recorded history +
/// everyone's live fixes on this booking). See API-CONTRACT.md "Live GPS
/// tracking" and docs/FUNCTIONAL-REVIEW.md N7.
@MainActor
@Observable
final class LiveTracker {
    struct Fix: Equatable { let lat: Double; let lng: Double }
    enum Phase: Equatable { case connecting, tracking, noBooking, denied, failed }

    private(set) var phase: Phase = .connecting
    private(set) var fixes: [Fix] = []
    private(set) var startedAt: Date?
    private(set) var activeBookingID: String?

    private var socket: URLSessionWebSocketTask?
    private let manager = CLLocationManager()
    private var locationDelegate: LocationDelegate?

    /// Total path length in metres (haversine over the fixes).
    var distanceMeters: Double {
        guard fixes.count > 1 else { return 0 }
        return zip(fixes, fixes.dropFirst()).reduce(0) { $0 + haversine($1.0, $1.1) }
    }

    func start(bookingID: String?) async {
        let resolved: String?
        if let bookingID {
            resolved = bookingID
        } else {
            resolved = (try? await APIClient.shared.bookings())?
                .first { $0.status != .cancelled }?.id
        }
        guard let bookingID = resolved else { phase = .noBooking; return }
        guard let token = APIClient.shared.bearerToken else { phase = .failed; return }
        activeBookingID = bookingID
        connect(bookingID: bookingID, token: token)
        startLocation()
    }

    func stop() {
        socket?.cancel(with: .goingAway, reason: nil)
        socket = nil
        manager.stopUpdatingLocation()
    }

    /// Demo: ask the backend to replay a route into this booking's channel so
    /// movement shows up on a stationary simulator.
    func simulate() async {
        guard let id = activeBookingID else { return }
        try? await APIClient.shared.simulateWalk(bookingID: id)
    }

    // MARK: - WebSocket

    private func connect(bookingID: String, token: String) {
        guard var comps = URLComponents(url: APIClient.shared.baseURL, resolvingAgainstBaseURL: false)
        else { phase = .failed; return }
        comps.scheme = comps.scheme == "https" ? "wss" : "ws"
        comps.path = "/ws/track/\(bookingID)"
        comps.queryItems = [URLQueryItem(name: "token", value: token)]
        guard let url = comps.url else { phase = .failed; return }
        let task = URLSession.shared.webSocketTask(with: url)
        socket = task
        task.resume()
        receive()
    }

    private func receive() {
        socket?.receive { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                switch result {
                case .success(let message):
                    if case .string(let text) = message { self.handle(text) }
                    self.receive()
                case .failure:
                    if self.phase != .noBooking { self.phase = .failed }
                }
            }
        }
    }

    private func handle(_ text: String) {
        guard let data = text.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
        switch obj["type"] as? String {
        case "history":
            let points = obj["points"] as? [[String: Any]] ?? []
            fixes = points.compactMap { fix($0) }
            phase = .tracking
            if !fixes.isEmpty, startedAt == nil { startedAt = Date() }
        case "position":
            if let f = fix(obj) {
                fixes.append(f)
                if startedAt == nil { startedAt = Date() }
            }
            phase = .tracking
        default:
            break
        }
    }

    private func fix(_ o: [String: Any]) -> Fix? {
        guard let lat = o["lat"] as? Double, let lng = o["lng"] as? Double else { return nil }
        return Fix(lat: lat, lng: lng)
    }

    private func publish(lat: Double, lng: Double) {
        let json = "{\"type\":\"position\",\"lat\":\(lat),\"lng\":\(lng)}"
        socket?.send(.string(json)) { _ in }
    }

    // MARK: - Location

    private func startLocation() {
        let delegate = LocationDelegate(
            onUpdate: { [weak self] lat, lng in Task { @MainActor in self?.publish(lat: lat, lng: lng) } },
            onDenied: { [weak self] in Task { @MainActor in self?.phase = .denied } }
        )
        locationDelegate = delegate
        manager.delegate = delegate
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 5
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
    }
}

/// Bridges CLLocationManager (nonisolated callbacks) to the `@MainActor`
/// `LiveTracker`. The closures carry only Sendable doubles and hop to the main
/// actor themselves, so there's no cross-actor data race under Swift 6.
private final class LocationDelegate: NSObject, CLLocationManagerDelegate {
    private let onUpdate: @Sendable (Double, Double) -> Void
    private let onDenied: @Sendable () -> Void

    init(onUpdate: @escaping @Sendable (Double, Double) -> Void, onDenied: @escaping @Sendable () -> Void) {
        self.onUpdate = onUpdate
        self.onDenied = onDenied
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let last = locations.last else { return }
        onUpdate(last.coordinate.latitude, last.coordinate.longitude)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .denied, .restricted:
            onDenied()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.startUpdatingLocation()
        default:
            break
        }
    }
}

private func haversine(_ a: LiveTracker.Fix, _ b: LiveTracker.Fix) -> Double {
    let R = 6_371_000.0
    let dLat = (b.lat - a.lat) * .pi / 180
    let dLng = (b.lng - a.lng) * .pi / 180
    let la = a.lat * .pi / 180, lb = b.lat * .pi / 180
    let h = sin(dLat / 2) * sin(dLat / 2) + sin(dLng / 2) * sin(dLng / 2) * cos(la) * cos(lb)
    return 2 * R * asin(min(1, sqrt(h)))
}
