import SwiftUI

/// A status dot with an expanding "radar" pulse ring — the HUD's signature element.
struct PulsingDot: View {
    var color: Color
    var size: CGFloat = 8
    @State private var animate = false

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .scaleEffect(animate ? 1.9 : 1.0)
                .opacity(animate ? 0 : 0.22)
            Circle().fill(color)
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.easeOut(duration: 1.9).repeatForever(autoreverses: false)) {
                animate = true
            }
        }
    }
}

/// Uppercase mono caption — the recurring coordinate/label style.
struct MonoCaption: View {
    let text: String
    var size: CGFloat = 10
    var weight: Font.Weight = .medium
    var tracking: CGFloat = 0.12
    var color: Color = Brand.ink.opacity(0.6)

    init(_ text: String, size: CGFloat = 10, weight: Font.Weight = .medium,
         tracking: CGFloat = 0.12, color: Color = Brand.ink.opacity(0.6)) {
        self.text = text; self.size = size; self.weight = weight
        self.tracking = tracking; self.color = color
    }

    var body: some View {
        Text(text.uppercased())
            .font(.mono(size, weight))
            .tracking(tracking * size)   // CSS letter-spacing is em-relative
            .foregroundStyle(color)
    }
}
