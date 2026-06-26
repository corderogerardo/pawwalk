import SwiftUI

/// Placeholder for Phase 1 — the booking list + booking flow lands here.
struct BookingsView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView {
                Label("No bookings yet", systemImage: "calendar.badge.plus")
            } description: {
                Text("Book a walk from the Walkers tab and it'll show up here.")
            }
            .navigationTitle("Bookings")
        }
    }
}

#Preview {
    BookingsView()
}
