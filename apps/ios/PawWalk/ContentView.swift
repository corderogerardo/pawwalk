import SwiftUI

/// Root view. Gated on `AuthSession`: signed out shows `AuthView`, signed in
/// shows the designed Home screen (with its own HUD tab bar), which presents
/// Live GPS tracking. Light/dark follow the system appearance via the Brand
/// color tokens.
struct ContentView: View {
    @Environment(AuthSession.self) private var auth

    var body: some View {
        Group {
            if auth.isRestoring {
                Brand.canvas.ignoresSafeArea()
            } else if auth.signedIn {
                if auth.currentUser?.role == .walker {
                    WalkerHomeView()
                } else {
                    HomeView()
                }
            } else {
                AuthView()
            }
        }
        .tint(Brand.accent)
    }
}

#Preview {
    ContentView()
        .environment(AuthSession())
}
