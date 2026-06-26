import Foundation

/// Tiny async/await HTTP client for the PawWalk backend.
///
/// Learning note: `async`/`await` + `URLSession.data(for:)` is the modern way to
/// do networking in Swift — no completion handlers, no callback pyramids.
struct APIClient {
    static let shared = APIClient()

    /// The iOS Simulator shares the Mac's network, so localhost reaches the
    /// backend started with `uv run fastapi dev`.
    var baseURL = URL(string: "http://localhost:8000")!

    private var decoder: JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }

    func walkers() async throws -> [Walker] {
        let url = baseURL.appendingPathComponent("walkers")
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try decoder.decode([Walker].self, from: data)
    }
}
