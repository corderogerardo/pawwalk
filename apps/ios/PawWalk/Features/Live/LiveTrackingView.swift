import SwiftUI

/// PawWalk — Live GPS Tracking (the hero screen). The dark mission-control HUD is
/// now driven by **real** GPS: the device streams CoreLocation fixes over a
/// WebSocket and the traveled route + telemetry are computed from them
/// (docs/FUNCTIONAL-REVIEW.md N7). No map tiles = no map cost.
struct LiveTrackingView: View {
    var bookingID: String? = nil
    /// The dog on this walk (from the booking) — shown in the HUD instead of a
    /// hardcoded name.
    var dogName: String? = nil

    @Environment(\.dismiss) private var dismiss
    @State private var tracker = LiveTracker()
    private let on = Brand.onInverse

    var body: some View {
        ZStack {
            Brand.inverse.ignoresSafeArea()

            TimelineView(.animation) { timeline in
                MapCanvas(date: timeline.date, fixes: tracker.fixes, dogName: dogName ?? "Your dog")
                    .ignoresSafeArea()
            }

            VStack {
                LinearGradient(colors: [Brand.inverseScrim.opacity(0.94), Brand.inverseScrim.opacity(0)],
                               startPoint: .top, endPoint: .bottom)
                    .frame(height: 240)
                Spacer()
                LinearGradient(colors: [Brand.inverseScrim.opacity(0), Brand.inverseScrim.opacity(0.96)],
                               startPoint: .top, endPoint: .bottom)
                    .frame(height: 250)
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)

            VStack {
                topHUD
                Spacer()
                statusLine
                bottomHUD
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 16)
        }
        .task { await tracker.start(bookingID: bookingID) }
        .onDisappear { tracker.stop() }
        .gesture(DragGesture().onEnded { if $0.translation.height > 80 { dismiss() } })
    }

    private var topHUD: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                HStack(spacing: 7) {
                    PulsingDot(color: Brand.accent)
                    MonoCaption(tracker.phase == .tracking ? "Live · Walk in progress" : "Live · Connecting", color: on)
                }
                Spacer()
                if tracker.phase != .noBooking {
                    Button { Task { await tracker.simulate() } } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "play.fill").font(.system(size: 8))
                            Text("Demo").font(.mono(9)).tracking(0.6)
                        }
                        .foregroundStyle(on)
                        .padding(.horizontal, 9).padding(.vertical, 4)
                        .overlay(Capsule().stroke(on.opacity(0.3), lineWidth: 1))
                    }
                    .padding(.trailing, 10)
                }
                Button { dismiss() } label: {
                    Image(systemName: "arrow.up.left.and.arrow.down.right")
                        .font(.system(size: 13)).foregroundStyle(on.opacity(0.55))
                }
            }
            HStack(alignment: .bottom, spacing: 18) {
                VStack(alignment: .leading, spacing: 3) {
                    MonoCaption("Elapsed", size: 9, color: on.opacity(0.5))
                    TimelineView(.periodic(from: .now, by: 1)) { _ in
                        Text(elapsedLabel).font(.mono(34)).tracking(-1).foregroundStyle(on)
                    }
                }
                metric("Distance", distanceLabel)
                metric("Pace", paceLabel)
            }
            .padding(.top, 18)
        }
    }

    private func metric(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            MonoCaption(label, size: 9, color: on.opacity(0.5))
            Text(value).font(.dm(18, .semibold)).foregroundStyle(on)
        }
        .padding(.bottom, 3)
    }

    @ViewBuilder
    private var statusLine: some View {
        let text: String? = {
            switch tracker.phase {
            case .noBooking: return "No active walk to track — book one first."
            case .denied:    return "Location access is off. Enable it in Settings to track."
            case .failed:    return "Lost connection to the tracker."
            case .connecting: return tracker.fixes.isEmpty ? "Acquiring GPS…" : nil
            case .tracking:  return tracker.fixes.isEmpty ? "Waiting for the first fix…" : nil
            }
        }()
        if let text {
            MonoCaption(text, size: 10, weight: .regular, tracking: 0.05, color: on.opacity(0.85))
                .padding(.horizontal, 12).padding(.vertical, 8)
                .background(Capsule().fill(Brand.inverse2.opacity(0.7)))
                .padding(.bottom, 10)
        }
    }

    private var bottomHUD: some View {
        HStack(spacing: 11) {
            Circle().fill(Brand.inverse2)
                .overlay(Circle().stroke(on.opacity(0.22), lineWidth: 1))
                .frame(width: 40, height: 40)
                .overlay(Image(systemName: "pawprint.fill").font(.system(size: 16)).foregroundStyle(on.opacity(0.5)))
            VStack(alignment: .leading, spacing: 2) {
                Text(dogName ?? "Your dog").font(.dm(14, .semibold)).foregroundStyle(on)
                MonoCaption("\(tracker.fixes.count) fixes · live", size: 9, weight: .regular,
                            tracking: 0.07, color: on.opacity(0.6))
            }
            Spacer()
        }
        .padding(EdgeInsets(top: 11, leading: 12, bottom: 11, trailing: 12))
        .background(Color(hex: 0x2A3440).opacity(0.65))
        .background(.ultraThinMaterial)
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(on.opacity(0.14), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    // MARK: - Derived telemetry

    private var elapsedLabel: String {
        guard let start = tracker.startedAt else { return "00:00" }
        let s = Int(Date().timeIntervalSince(start))
        return String(format: "%02d:%02d", s / 60, s % 60)
    }

    private var distanceLabel: String {
        let m = tracker.distanceMeters
        return m < 1000 ? "\(Int(m)) m" : String(format: "%.2f km", m / 1000)
    }

    private var paceLabel: String {
        let m = tracker.distanceMeters
        guard let start = tracker.startedAt, m > 20 else { return "—" }
        let minutes = Date().timeIntervalSince(start) / 60
        let pace = minutes / (m / 1000)  // min per km
        guard pace.isFinite, pace < 99 else { return "—" }
        return String(format: "%d′%02d″/km", Int(pace), Int((pace - Double(Int(pace))) * 60))
    }
}

// MARK: - The map (real route, normalized — no basemap tiles)

private struct MapCanvas: View {
    let date: Date
    let fixes: [LiveTracker.Fix]
    let dogName: String
    @Environment(\.self) private var env

    var body: some View {
        Canvas { ctx, size in
            let onColor = env.colorScheme == .dark ? Color(hex: 0xF4F2FC) : Color(hex: 0xF5F3FA)
            let accent  = env.colorScheme == .dark ? Color(hex: 0x8E7DFF) : Color(hex: 0x5B4BE0)
            let inverse = env.colorScheme == .dark ? Color(hex: 0x221B3F) : Color(hex: 0x171327)

            // Static grid backdrop (keeps the HUD look without a paid map tile).
            var grid = Path()
            let step = size.width / 10
            for gx in stride(from: 0, through: size.width, by: step) { grid.move(to: CGPoint(x: gx, y: 0)); grid.addLine(to: CGPoint(x: gx, y: size.height)) }
            for gy in stride(from: 0, through: size.height, by: step) { grid.move(to: CGPoint(x: 0, y: gy)); grid.addLine(to: CGPoint(x: size.width, y: gy)) }
            ctx.stroke(grid, with: .color(onColor.opacity(0.05)), lineWidth: 1)

            guard !fixes.isEmpty else { return }

            // Equirectangular projection (equal aspect) → screen, centered in a padded rect.
            let midLat = (fixes.map(\.lat).min()! + fixes.map(\.lat).max()!) / 2
            let cosLat = cos(midLat * .pi / 180)
            func proj(_ f: LiveTracker.Fix) -> CGPoint { CGPoint(x: f.lng * cosLat, y: f.lat) }
            let ps = fixes.map(proj)
            let minX = ps.map(\.x).min()!, maxX = ps.map(\.x).max()!
            let minY = ps.map(\.y).min()!, maxY = ps.map(\.y).max()!
            let spanX = max(maxX - minX, 1e-12), spanY = max(maxY - minY, 1e-12)
            let rect = CGRect(x: 60, y: 170, width: size.width - 120, height: size.height - 360)
            let scale = min(rect.width / spanX, rect.height / spanY)
            let cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
            func screen(_ f: LiveTracker.Fix) -> CGPoint {
                let p = proj(f)
                return CGPoint(x: rect.midX + (p.x - cx) * scale, y: rect.midY - (p.y - cy) * scale)
            }
            let pts = fixes.map(screen)

            // Traveled route (solid accent).
            if pts.count > 1 {
                var route = Path()
                route.move(to: pts[0])
                pts.dropFirst().forEach { route.addLine(to: $0) }
                ctx.stroke(route, with: .color(accent),
                           style: StrokeStyle(lineWidth: 3.5, lineCap: .round, lineJoin: .round))
            }

            // Start marker (square).
            if let first = pts.first {
                ctx.stroke(Path(CGRect(x: first.x - 5, y: first.y - 5, width: 10, height: 10)),
                           with: .color(onColor.opacity(0.7)), lineWidth: 2)
            }

            // Current position — pulsing ping at the latest fix.
            guard let cp = pts.last else { return }
            let t = date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1.8) / 1.8
            let pingR = 12 + 22 * t
            ctx.fill(Path(ellipseIn: CGRect(x: cp.x - pingR, y: cp.y - pingR, width: 2 * pingR, height: 2 * pingR)),
                     with: .color(accent.opacity(0.45 * (1 - t))))
            ctx.fill(Path(ellipseIn: CGRect(x: cp.x - 8, y: cp.y - 8, width: 16, height: 16)), with: .color(accent))
            ctx.stroke(Path(ellipseIn: CGRect(x: cp.x - 8, y: cp.y - 8, width: 16, height: 16)),
                       with: .color(onColor), lineWidth: 2.5)

            // "<DOG> · HERE" label, sized to the dog's actual name.
            let labelText = "\(dogName.uppercased()) · HERE"
            let label = ctx.resolve(Text(labelText).font(.mono(9)).foregroundColor(onColor))
            let textSize = label.measure(in: CGSize(width: 300, height: 19))
            let labelRect = CGRect(x: cp.x + 12, y: cp.y - 9, width: textSize.width + 18, height: 19)
            ctx.fill(Path(roundedRect: labelRect, cornerRadius: 5), with: .color(inverse.opacity(0.82)))
            ctx.stroke(Path(roundedRect: labelRect, cornerRadius: 5), with: .color(onColor.opacity(0.18)), lineWidth: 1)
            ctx.draw(label, at: CGPoint(x: labelRect.minX + 9, y: labelRect.midY), anchor: .leading)
        }
    }
}

#Preview { LiveTrackingView() }
