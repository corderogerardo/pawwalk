import SwiftUI

struct WalkersView: View {
    @State private var model = WalkersViewModel()

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Find a walker")
                .task { await model.load() }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .loading:
            ProgressView("Finding walkers…")
        case .failed(let message):
            ContentUnavailableView(
                "Couldn't load walkers",
                systemImage: "exclamationmark.triangle",
                description: Text(message)
            )
        case .loaded(let walkers):
            List(walkers) { walker in
                WalkerRow(walker: walker)
            }
            .listStyle(.plain)
        }
    }
}

private struct WalkerRow: View {
    let walker: Walker

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(walker.name).font(.headline)
                Spacer()
                Label(String(format: "%.1f", walker.rating), systemImage: "star.fill")
                    .font(.subheadline)
                    .foregroundStyle(Color.brand)
            }
            Text(walker.bio)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack {
                Text(walker.neighborhoods.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(Color.brand)
                Spacer()
                Text(walker.priceLabel).font(.caption).bold()
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    WalkersView()
}
