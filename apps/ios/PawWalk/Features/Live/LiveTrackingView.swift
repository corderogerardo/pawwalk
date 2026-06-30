import SwiftUI

/// PawWalk — Live GPS Tracking (the hero screen). Ported from the design handoff
/// (iOS 03 · Live · Telemetry). A dark mission-control map with a live route,
/// event pins, a pulsing current position, and a telemetry HUD.
struct LiveTrackingView: View {
    @Environment(\.dismiss) private var dismiss
    private let on = Brand.onInverse

    var body: some View {
        ZStack {
            Brand.inverse.ignoresSafeArea()

            TimelineView(.animation) { timeline in
                MapCanvas(date: timeline.date)
                    .ignoresSafeArea()
            }

            // Top + bottom scrims for HUD legibility
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
                bottomHUD
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 16)
        }
        .gesture(DragGesture().onEnded { if $0.translation.height > 80 { dismiss() } })
    }

    private var topHUD: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                HStack(spacing: 7) {
                    PulsingDot(color: Brand.accent)
                    MonoCaption("Live · Walk in progress", color: on)
                }
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "arrow.up.left.and.arrow.down.right")
                        .font(.system(size: 13)).foregroundStyle(on.opacity(0.55))
                }
            }
            HStack(alignment: .bottom, spacing: 18) {
                VStack(alignment: .leading, spacing: 3) {
                    MonoCaption("Elapsed", size: 9, color: on.opacity(0.5))
                    Text("18:42").font(.mono(34)).tracking(-1).foregroundStyle(on)
                }
                metric("Distance", "2.4 km")
                metric("Pace", "12′/km")
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

    private var bottomHUD: some View {
        VStack(alignment: .leading, spacing: 11) {
            VStack(alignment: .leading, spacing: 6) {
                eventRow("16:28", Brand.pinAmber, "Sniff stop · 0:48")
                eventRow("16:24", Brand.pinBlue, "Pee break logged")
            }
            walkerCard
        }
    }

    private func eventRow(_ time: String, _ dot: Color, _ text: String) -> some View {
        HStack(spacing: 9) {
            Text(time).font(.mono(9)).foregroundStyle(on.opacity(0.45)).frame(width: 38, alignment: .leading)
            Circle().fill(dot).frame(width: 5, height: 5)
            MonoCaption(text, size: 9.5, weight: .regular, tracking: 0.06, color: on.opacity(0.8))
        }
    }

    private var walkerCard: some View {
        HStack(spacing: 11) {
            Circle().fill(Brand.inverse2)
                .overlay(Circle().stroke(on.opacity(0.22), lineWidth: 1))
                .frame(width: 40, height: 40)
                .overlay(Image(systemName: "person.fill").font(.system(size: 16)).foregroundStyle(on.opacity(0.5)))
            VStack(alignment: .leading, spacing: 2) {
                Text("Elena Vega").font(.dm(14, .semibold)).foregroundStyle(on)
                MonoCaption("Unit 07 · walking now", size: 9, weight: .regular, tracking: 0.07, color: on.opacity(0.6))
            }
            Spacer()
            Button {} label: {
                Image(systemName: "bubble.left").font(.system(size: 15)).foregroundStyle(on)
                    .frame(width: 42, height: 42)
                    .overlay(RoundedRectangle(cornerRadius: 13).stroke(on.opacity(0.18), lineWidth: 1))
            }
            Button {} label: {
                Image(systemName: "phone.fill").font(.system(size: 15)).foregroundStyle(on)
                    .frame(width: 42, height: 42)
                    .background(Brand.signalGreen, in: RoundedRectangle(cornerRadius: 13))
            }
        }
        .padding(EdgeInsets(top: 11, leading: 12, bottom: 11, trailing: 12))
        .background(Color(hex: 0x2A3440).opacity(0.65))
        .background(.ultraThinMaterial)
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(on.opacity(0.14), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

// MARK: - The map

private struct MapCanvas: View {
    let date: Date
    @Environment(\.self) private var env

    var body: some View {
        Canvas { ctx, size in
            let scale = max(size.width / 390, size.height / 862)
            let ox = (size.width - 390 * scale) / 2
            let oy = (size.height - 862 * scale) / 2
            func P(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * scale + ox, y: y * scale + oy) }

            let onColor = env.colorScheme == .dark ? Color(hex: 0xF4F2FC) : Color(hex: 0xF5F3FA)
            let accent  = env.colorScheme == .dark ? Color(hex: 0x8E7DFF) : Color(hex: 0x5B4BE0)
            let inverse = env.colorScheme == .dark ? Color(hex: 0x221B3F) : Color(hex: 0x171327)

            // grid
            var grid = Path()
            for gx in stride(from: 0.0, through: 390.0, by: 39.0) { grid.move(to: P(gx, 0)); grid.addLine(to: P(gx, 862)) }
            for gy in stride(from: 0.0, through: 862.0, by: 39.0) { grid.move(to: P(0, gy)); grid.addLine(to: P(390, gy)) }
            ctx.stroke(grid, with: .color(onColor.opacity(0.05)), lineWidth: 1)

            // faint blocks
            func block(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ c: Color) {
                let r = CGRect(origin: P(x, y), size: CGSize(width: w * scale, height: h * scale))
                ctx.fill(Path(roundedRect: r, cornerRadius: 10 * scale), with: .color(c))
            }
            block(196, 332, 150, 120, onColor.opacity(0.04))
            block(40, 240, 92, 120, Brand.signalGreen.opacity(0.06))
            block(150, 500, 120, 80, onColor.opacity(0.04))

            // dashed remaining route (marching)
            let phase = -date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1) * 16
            var dashed = Path()
            dashed.addLines([P(300,300), P(300,238), P(230,208), P(160,220), P(150,300)])
            ctx.stroke(dashed, with: .color(onColor.opacity(0.38)),
                       style: StrokeStyle(lineWidth: 2.5 * scale, lineCap: .round, lineJoin: .round,
                                          dash: [3 * scale, 8 * scale], dashPhase: phase * scale))

            // traveled route (solid accent)
            var route = Path()
            route.addLines([P(60,600), P(60,520), P(120,470), P(120,400), P(200,360), P(270,360), P(300,300)])
            ctx.stroke(route, with: .color(accent),
                       style: StrokeStyle(lineWidth: 3.5 * scale, lineCap: .round, lineJoin: .round))

            // start marker (square)
            ctx.stroke(Path(CGRect(origin: P(55,595), size: CGSize(width: 10*scale, height: 10*scale))),
                       with: .color(onColor.opacity(0.7)), lineWidth: 2 * scale)
            // event pins
            func dot(_ x: CGFloat, _ y: CGFloat, _ r: CGFloat, _ c: Color) {
                ctx.fill(Path(ellipseIn: CGRect(x: P(x,y).x - r*scale, y: P(x,y).y - r*scale, width: 2*r*scale, height: 2*r*scale)), with: .color(c))
            }
            dot(120, 470, 4, Brand.pinBlue)
            dot(200, 360, 4, Brand.pinAmber)
            // home (end) ring
            ctx.stroke(Path(ellipseIn: CGRect(x: P(150,300).x - 5*scale, y: P(150,300).y - 5*scale, width: 10*scale, height: 10*scale)),
                       with: .color(onColor.opacity(0.55)), lineWidth: 2 * scale)

            // current position — pulsing ping
            let t = date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1.8) / 1.8
            let pingR = (12 + 22 * t) * scale
            let cp = P(300, 300)
            ctx.fill(Path(ellipseIn: CGRect(x: cp.x - pingR, y: cp.y - pingR, width: 2*pingR, height: 2*pingR)),
                     with: .color(accent.opacity(0.45 * (1 - t))))
            ctx.fill(Path(ellipseIn: CGRect(x: cp.x - 8*scale, y: cp.y - 8*scale, width: 16*scale, height: 16*scale)), with: .color(accent))
            ctx.stroke(Path(ellipseIn: CGRect(x: cp.x - 8*scale, y: cp.y - 8*scale, width: 16*scale, height: 16*scale)),
                       with: .color(onColor), lineWidth: 2.5 * scale)

            // "MOCHI · HERE" label
            let labelRect = CGRect(origin: P(247, 315), size: CGSize(width: 106*scale, height: 19*scale))
            ctx.fill(Path(roundedRect: labelRect, cornerRadius: 5*scale), with: .color(inverse.opacity(0.82)))
            ctx.stroke(Path(roundedRect: labelRect, cornerRadius: 5*scale), with: .color(onColor.opacity(0.18)), lineWidth: 1)
            let label = ctx.resolve(Text("MOCHI · HERE").font(.mono(9)).foregroundColor(onColor))
            ctx.draw(label, at: CGPoint(x: labelRect.minX + 9*scale, y: labelRect.midY), anchor: .leading)
        }
    }
}

#Preview { LiveTrackingView() }
