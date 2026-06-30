import SwiftUI
import UIKit

// MARK: - PawWalk "Subtle HUD" design system
// Ported from the design handoff (formerly "TROT"). Indigo accent, cool paper,
// indigo-black ink, DM Sans display + JetBrains Mono readouts. Full light/dark.

extension UIColor {
    convenience init(hex: UInt) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}

extension Color {
    init(hex: UInt) { self.init(UIColor(hex: hex)) }

    /// A color that resolves differently in light vs dark appearance.
    init(light: UInt, dark: UInt) {
        self.init(UIColor { trait in
            UIColor(hex: trait.userInterfaceStyle == .dark ? dark : light)
        })
    }
}

/// Semantic design tokens. Names mirror the CSS custom properties in the handoff.
enum Brand {
    // Theme-aware tokens (light → dark)
    static let canvas      = Color(light: 0xF5F3FA, dark: 0x0E0A1C)
    static let canvasDeep  = Color(light: 0xE7E4F2, dark: 0x1C1636)
    static let ink         = Color(light: 0x171327, dark: 0xECEAF7)
    static let accent      = Color(light: 0x5B4BE0, dark: 0x8E7DFF)
    static let inverse     = Color(light: 0x171327, dark: 0x221B3F)
    static let inverse2    = Color(light: 0x2C2647, dark: 0x2E2752)
    static let onInverse   = Color(light: 0xF5F3FA, dark: 0xF4F2FC)
    /// Scrim base for the GPS map (kept dark in both themes).
    static let inverseScrim = Color(light: 0x171327, dark: 0x07050F)

    // Fixed signal colors (identical in both themes)
    static let signalGreen     = Color(hex: 0x4A7A5E)
    static let signalGreenSoft = Color(hex: 0x9FD3C0)
    static let pinBlue         = Color(hex: 0x457B9D)
    static let pinAmber        = Color(hex: 0xC68A1E)
}

// MARK: - Type

extension Font {
    /// DM Sans — display / UI sans.
    static func dm(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .bold:               name = "DMSans-Bold"
        case .semibold:           name = "DMSans-SemiBold"
        case .medium:             name = "DMSans-Medium"
        default:                  name = "DMSans-Regular"
        }
        return .custom(name, size: size)
    }

    /// JetBrains Mono — readouts, coordinates, labels.
    static func mono(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .semibold, .bold:    name = "JetBrainsMono-SemiBold"
        case .medium:             name = "JetBrainsMono-Medium"
        default:                  name = "JetBrainsMono-Regular"
        }
        return .custom(name, size: size)
    }
}
