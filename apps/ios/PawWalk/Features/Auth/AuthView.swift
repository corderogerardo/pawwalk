import SwiftUI

/// Login ↔ Sign up, toggled by `mode`. One screen instead of two — they share
/// every field except `name`, so a second file would just be duplication.
struct AuthView: View {
    private enum Mode {
        case login, signup

        var title: String { self == .login ? "Welcome back." : "Join PawWalk." }
        var cta: String { self == .login ? "Log in" : "Sign up" }
        var toggleHint: String { self == .login ? "New here?" : "Already have an account?" }
        var toggleAction: String { self == .login ? "Sign up" : "Log in" }
    }

    @Environment(AuthSession.self) private var auth

    @State private var mode: Mode = .login
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var isSubmitting = false
    @State private var validationMessage: String?

    var body: some View {
        ZStack {
            Brand.canvas.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    header
                    fields
                    if let message = validationMessage ?? auth.errorMessage {
                        MonoCaption(message, size: 10, weight: .regular, tracking: 0.06, color: .red)
                    }
                    submitButton
                    toggleRow
                }
                .padding(.horizontal, 24)
                .padding(.top, 80)
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 7) {
            MonoCaption("PawWalk · Auth", color: Brand.accent)
            Text(mode.title)
                .font(.dm(34, .medium)).tracking(-1.2)
                .foregroundStyle(Brand.ink)
        }
    }

    private var fields: some View {
        VStack(spacing: 12) {
            if mode == .signup {
                AuthField(label: "Name", text: $name, textContentType: .name)
            }
            AuthField(label: "Email", text: $email, keyboard: .emailAddress, textContentType: .emailAddress)
            AuthField(label: "Password", text: $password, isSecure: true,
                      textContentType: mode == .login ? .password : .newPassword)
        }
    }

    private var submitButton: some View {
        Button(action: submit) {
            HStack {
                Spacer()
                if isSubmitting {
                    ProgressView().tint(Brand.onInverse)
                } else {
                    Text(mode.cta).font(.dm(14, .semibold))
                }
                Spacer()
            }
            .frame(height: 46)
            .background(Brand.accent)
            .foregroundStyle(Brand.onInverse)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .disabled(isSubmitting)
    }

    private var toggleRow: some View {
        HStack(spacing: 5) {
            Text(mode.toggleHint).font(.dm(13)).foregroundStyle(Brand.ink.opacity(0.6))
            Button(mode.toggleAction) {
                mode = mode == .login ? .signup : .login
                validationMessage = nil
                auth.errorMessage = nil
            }
            .font(.dm(13, .semibold))
            .foregroundStyle(Brand.accent)
        }
        .frame(maxWidth: .infinity)
    }

    private func submit() {
        guard let message = validate() else {
            validationMessage = nil
            Task {
                isSubmitting = true
                defer { isSubmitting = false }
                if mode == .login {
                    await auth.logIn(email: email, password: password)
                } else {
                    await auth.signUp(email: email, password: password, name: name)
                }
            }
            return
        }
        validationMessage = message
    }

    /// Client-side checks only — the backend is the source of truth (e.g. for
    /// "email already registered"). This just avoids a round trip for typos.
    private func validate() -> String? {
        if mode == .signup && name.trimmingCharacters(in: .whitespaces).isEmpty {
            return "Enter your name."
        }
        guard email.contains("@"), email.contains(".") else {
            return "Enter a valid email."
        }
        guard password.count >= 8 else {
            return "Password must be at least 8 characters."
        }
        return nil
    }
}

/// HUD-styled text field — underline rule instead of a boxed input, matching
/// the rest of the app's flat, mono-label aesthetic.
private struct AuthField: View {
    let label: String
    @Binding var text: String
    var isSecure: Bool = false
    var keyboard: UIKeyboardType = .default
    var textContentType: UITextContentType?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            MonoCaption(label, size: 9, tracking: 0.1)
            Group {
                if isSecure {
                    SecureField("", text: $text)
                } else {
                    TextField("", text: $text)
                        .keyboardType(keyboard)
                        .autocapitalization(.none)
                        .autocorrectionDisabled()
                }
            }
            .textContentType(textContentType)
            .font(.dm(15, .medium))
            .foregroundStyle(Brand.ink)
            Rectangle().fill(Brand.ink.opacity(0.18)).frame(height: 1)
        }
    }
}

#Preview {
    AuthView().environment(AuthSession())
}
