import SwiftUI

/// Root tab bar. Each tab is its own SwiftUI feature view.
struct ContentView: View {
    var body: some View {
        TabView {
            WalkersView()
                .tabItem { Label("Walkers", systemImage: "figure.walk") }
            BookingsView()
                .tabItem { Label("Bookings", systemImage: "calendar") }
        }
        .tint(.brand)
    }
}

#Preview {
    ContentView()
}
