import SwiftUI

/// PawWalk — Home / Status. Ported from the design handoff (iOS 01 · Home).
struct HomeView: View {
    @Environment(AuthSession.self) private var auth
    @State private var showLive = false
    @State private var showBooking = false
    @State private var showBookings = false

    var body: some View {
        ZStack(alignment: .bottom) {
            Brand.canvas.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 13) {
                    statusRow
                    dogHeader
                    Rectangle().fill(Brand.ink.opacity(0.12)).frame(height: 1)
                    NextWalkCard { showLive = true }
                    statsRow
                    recentWalks
                }
                .padding(.horizontal, 20)
                .padding(.top, 6)
                .padding(.bottom, 110)
            }

            HUDTabBar(onTrack: { showLive = true }, onBook: { showBooking = true })
                .padding(.horizontal, 16)
        }
        .fullScreenCover(isPresented: $showLive) { LiveTrackingView() }
        .sheet(isPresented: $showBooking) {
            WalkersView(onBooked: { _ in
                showBooking = false
                showBookings = true
            })
        }
        .sheet(isPresented: $showBookings) { BookingsView() }
    }

    private var statusRow: some View {
        HStack {
            HStack(spacing: 7) {
                PulsingDot(color: Brand.signalGreen)
                MonoCaption("Tracking ready")
            }
            Spacer()
            MonoCaption("37.77°N · UTC−7", size: 9, weight: .regular,
                        tracking: 0.08, color: Brand.ink.opacity(0.38))
            Button { auth.logOut() } label: {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .font(.system(size: 13))
                    .foregroundStyle(Brand.ink.opacity(0.5))
            }
            .padding(.leading, 10)
        }
    }

    private var dogHeader: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 0) {
                MonoCaption("Dog · 001", color: Brand.accent)
                Text("Mochi.")
                    .font(.dm(40, .medium)).tracking(-1.6)
                    .foregroundStyle(Brand.ink)
                    .padding(.top, 7)
                Text("Shiba Inu · 3 yrs · 9.4 kg")
                    .font(.dm(13.5, .medium)).foregroundStyle(Brand.ink)
                    .padding(.top, 9)
                MonoCaption("@ Sunset District", size: 10, weight: .regular,
                            tracking: 0.1, color: Brand.ink.opacity(0.6))
                    .padding(.top, 3)
            }
            Spacer()
            PawBadge(size: 54)
        }
    }

    private var statsRow: some View {
        HStack(spacing: 9) {
            StatTile(label: "This week", value: "04", unit: "walks", progress: 0.66)
            StatTile(label: "Distance", value: "12.3", unit: "km", progress: 0.82)
            StatTile(label: "Streak", value: "09", unit: "days", progress: 0.75, accent: true)
        }
    }

    private var recentWalks: some View {
        VStack(spacing: 0) {
            HStack {
                MonoCaption("§ Recent walks", tracking: 0.1)
                Spacer()
                MonoCaption("View all", size: 9, weight: .regular, tracking: 0.08, color: Brand.accent)
            }
            .padding(.bottom, 2)
            RecentWalkRow(points: [22, 11, 16, 6, 13, 5], title: "Riverside loop",
                          meta: "Sat · 45 min · 2.6 km · Elena V.")
            RecentWalkRow(points: [8, 18, 10, 20, 9, 15], title: "Dunes & pier",
                          meta: "Thu · 30 min · 1.8 km · Marcus T.")
        }
    }
}

// MARK: - Paw badge

struct PawBadge: View {
    var size: CGFloat
    var body: some View {
        ZStack(alignment: .topTrailing) {
            RoundedRectangle(cornerRadius: size * 0.29, style: .continuous)
                .stroke(Brand.ink, lineWidth: 1.5)
                .frame(width: size, height: size)
                .overlay(
                    Image(systemName: "pawprint.fill")
                        .font(.system(size: size * 0.4))
                        .foregroundStyle(Brand.ink)
                )
            Circle().fill(Brand.accent).frame(width: 5, height: 5)
                .padding(7)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Next walk card (dark)

struct NextWalkCard: View {
    var onTrack: () -> Void
    private let on = Brand.onInverse

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                MonoCaption("Next walk · Today", color: on.opacity(0.6))
                Spacer()
                HStack(spacing: 6) {
                    Circle().fill(Brand.accent).frame(width: 5, height: 5)
                    MonoCaption("ETA 00:26", size: 9.5, weight: .regular, tracking: 0.08, color: on)
                }
                .padding(.horizontal, 9).padding(.vertical, 3)
                .overlay(Capsule().stroke(on.opacity(0.22), lineWidth: 1))
            }
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("16:30").font(.dm(38, .medium)).tracking(-1.5).foregroundStyle(on)
                Text("→ 17:15").font(.mono(11)).foregroundStyle(on.opacity(0.55))
            }
            .padding(.top, 13)
            MonoCaption("45 min · Neighborhood loop · 2.4 km", size: 10, weight: .regular,
                        tracking: 0.09, color: on.opacity(0.72))
                .padding(.top, 6)

            Rectangle().fill(on.opacity(0.14)).frame(height: 1).padding(.vertical, 14)

            HStack(spacing: 11) {
                Circle().fill(Brand.inverse2)
                    .overlay(Circle().stroke(on.opacity(0.22), lineWidth: 1))
                    .frame(width: 38, height: 38)
                    .overlay(Image(systemName: "person.fill").font(.system(size: 15)).foregroundStyle(on.opacity(0.5)))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Elena Vega").font(.dm(14, .semibold)).foregroundStyle(on)
                    MonoCaption("Unit 07 · ★ 4.9 · 312 walks", size: 9, weight: .regular,
                                tracking: 0.07, color: on.opacity(0.6))
                }
                Spacer()
                HStack(spacing: 5) {
                    Image(systemName: "checkmark").font(.system(size: 8, weight: .bold))
                    Text("Vetted").font(.mono(8.5)).tracking(0.7)
                }
                .foregroundStyle(Brand.signalGreenSoft)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(Capsule().fill(Brand.signalGreen.opacity(0.18)))
                .overlay(Capsule().stroke(Brand.signalGreen.opacity(0.5), lineWidth: 1))
            }

            HStack(spacing: 8) {
                Button(action: onTrack) {
                    HStack(spacing: 7) {
                        Image(systemName: "location.fill").font(.system(size: 12))
                        Text("Track live").font(.dm(13, .semibold))
                    }
                    .frame(maxWidth: .infinity).frame(height: 42)
                    .background(Brand.accent).foregroundStyle(on)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                Button { } label: {
                    Image(systemName: "bubble.left").font(.system(size: 14))
                        .frame(width: 46, height: 42).foregroundStyle(on)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(on.opacity(0.22), lineWidth: 1))
                }
            }
            .padding(.top, 15)
        }
        .padding(EdgeInsets(top: 17, leading: 18, bottom: 17, trailing: 18))
        .background(Brand.inverse)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

// MARK: - Stat tile

struct StatTile: View {
    let label: String
    let value: String
    let unit: String
    let progress: CGFloat
    var accent: Bool = false

    var body: some View {
        let main = accent ? Brand.accent : Brand.ink
        VStack(alignment: .leading, spacing: 0) {
            MonoCaption(label, size: 8.5, tracking: 0.1,
                        color: accent ? Brand.accent : Brand.ink.opacity(0.55))
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(value).font(.mono(23)).tracking(-0.7).foregroundStyle(main)
                Text(unit).font(.mono(9)).foregroundStyle(main.opacity(accent ? 0.6 : 0.4))
            }
            .padding(.top, 5)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(main.opacity(accent ? 0.18 : 0.1))
                    Capsule().fill(accent ? Brand.accent : Brand.inverse)
                        .frame(width: geo.size.width * progress)
                }
            }
            .frame(height: 3)
            .padding(.top, 9)
        }
        .padding(.horizontal, 12).padding(.vertical, 11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(accent ? Brand.accent.opacity(0.28) : Brand.ink.opacity(0.12), lineWidth: 1)
        )
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(accent ? Brand.accent.opacity(0.06) : Color.clear)
        )
    }
}

// MARK: - Recent walk row + sparkline

struct RecentWalkRow: View {
    let points: [CGFloat]   // y-values in a 0...28 viewBox, 6 points across 42 wide
    let title: String
    let meta: String

    var body: some View {
        HStack(spacing: 12) {
            Sparkline(points: points).frame(width: 42, height: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.dm(13, .semibold)).foregroundStyle(Brand.ink)
                MonoCaption(meta, size: 9, weight: .regular, tracking: 0.07, color: Brand.ink.opacity(0.6))
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(Brand.ink.opacity(0.35))
        }
        .padding(.vertical, 11)
        .overlay(Rectangle().fill(Brand.ink.opacity(0.12)).frame(height: 1), alignment: .top)
    }
}

struct Sparkline: View {
    let points: [CGFloat]
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width, h = geo.size.height
            let xs = stride(from: 2.0, through: 40.0, by: 38.0 / Double(points.count - 1)).map { CGFloat($0) }
            let pts = zip(xs, points).map { CGPoint(x: $0 / 42 * w, y: $1 / 28 * h) }
            Path { p in
                p.move(to: pts[0])
                pts.dropFirst().forEach { p.addLine(to: $0) }
            }
            .stroke(Brand.ink, style: StrokeStyle(lineWidth: 1.4, lineCap: .round, lineJoin: .round))
            if let last = pts.last {
                Circle().fill(Brand.accent).frame(width: 4.4, height: 4.4).position(last)
            }
        }
    }
}

// MARK: - HUD tab bar

struct HUDTabBar: View {
    var onTrack: () -> Void
    var onBook: () -> Void = {}
    private let on = Brand.onInverse

    var body: some View {
        HStack(spacing: 2) {
            tab("house.fill", "Home", active: true) {}
            tab("calendar", "Book", action: onBook)
            tab("location.fill", "Track", action: onTrack)
            tab("pawprint.fill", "Mochi") {}
        }
        .padding(6)
        .background(Brand.inverse)
        .clipShape(Capsule())
        .shadow(color: Brand.ink.opacity(0.22), radius: 15, y: 14)
    }

    private func tab(_ icon: String, _ label: String, active: Bool = false,
                     action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 3) {
                Image(systemName: icon).font(.system(size: 15))
                Text(label.uppercased()).font(.mono(8.5)).tracking(0.7)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 9)
            .foregroundStyle(active ? on : on.opacity(0.6))
            .background(active ? Brand.accent : Color.clear, in: Capsule())
        }
    }
}

#Preview { HomeView().environment(AuthSession()) }
