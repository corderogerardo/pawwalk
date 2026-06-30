import SwiftUI

@main
struct PawWalkApp: App {
    @State private var auth = AuthSession()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(auth)
                .task {
                    StripeConfig.activate()
                    await auth.restore()
                }
        }
    }
}
