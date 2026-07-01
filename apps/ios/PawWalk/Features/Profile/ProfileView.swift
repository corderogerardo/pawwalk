import SwiftUI

/// Account / dog screen — the destination for the "Mochi" tab that used to be a
/// dead no-op (see docs/FUNCTIONAL-REVIEW.md N2). Shows the signed-in user, the
/// dog, a way into their bookings, and the (relocated) logout action.
struct ProfileView: View {
    @Environment(AuthSession.self) private var auth
    @Environment(\.dismiss) private var dismiss
    @State private var showBookings = false
    @State private var showPets = false
    @State private var pets: [Pet] = []

    var body: some View {
        ZStack {
            Brand.canvas.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    Rectangle().fill(Brand.ink.opacity(0.12)).frame(height: 1)
                    petsSection
                    petsButton
                    bookingsButton
                    Spacer(minLength: 24)
                    logoutButton
                }
                .padding(.horizontal, 24)
                .padding(.top, 28)
            }
        }
        .task { pets = (try? await APIClient.shared.pets()) ?? [] }
        .sheet(isPresented: $showBookings) { BookingsView() }
        .sheet(isPresented: $showPets, onDismiss: { Task { pets = (try? await APIClient.shared.pets()) ?? [] } }) {
            PetsView()
        }
    }

    @ViewBuilder
    private var petsSection: some View {
        if pets.isEmpty {
            Button { showPets = true } label: {
                HStack {
                    Image(systemName: "pawprint").font(.system(size: 16))
                    Text("Add your first pet").font(.dm(14, .semibold))
                    Spacer()
                    Image(systemName: "plus").font(.system(size: 13)).foregroundStyle(Brand.accent)
                }
                .foregroundStyle(Brand.ink)
                .padding(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Brand.ink.opacity(0.12), lineWidth: 1))
            }
        } else {
            VStack(spacing: 0) {
                ForEach(pets) { pet in
                    HStack(spacing: 12) {
                        PawBadge(size: 40)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(pet.name).font(.dm(15, .semibold)).foregroundStyle(Brand.ink)
                            if !pet.subtitle.isEmpty {
                                MonoCaption(pet.subtitle, size: 9, weight: .regular, tracking: 0.06, color: Brand.ink.opacity(0.6))
                            }
                        }
                        Spacer()
                    }
                    .padding(.vertical, 8)
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 4)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Brand.ink.opacity(0.12), lineWidth: 1))
        }
    }

    private var petsButton: some View {
        Button { showPets = true } label: {
            HStack {
                Image(systemName: "pawprint.fill").font(.system(size: 15))
                Text("Manage pets").font(.dm(14, .semibold))
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(Brand.ink.opacity(0.35))
            }
            .foregroundStyle(Brand.ink)
            .padding(.horizontal, 16).frame(height: 52)
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Brand.ink.opacity(0.12), lineWidth: 1))
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                MonoCaption("PawWalk · Account", color: Brand.accent)
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Brand.ink.opacity(0.5))
                }
            }
            Text(auth.currentUser?.name ?? "Guest")
                .font(.dm(34, .medium)).tracking(-1.2)
                .foregroundStyle(Brand.ink)
            if let email = auth.currentUser?.email {
                MonoCaption(email, size: 10, weight: .regular, tracking: 0.06,
                            color: Brand.ink.opacity(0.6))
            }
            if let joined = auth.currentUser?.createdAt {
                MonoCaption("Member since \(joined.formatted(date: .abbreviated, time: .omitted))",
                            size: 9, weight: .regular, tracking: 0.08,
                            color: Brand.ink.opacity(0.45))
            }
        }
    }

    private var bookingsButton: some View {
        Button { showBookings = true } label: {
            HStack {
                Image(systemName: "calendar").font(.system(size: 15))
                Text("Your bookings").font(.dm(14, .semibold))
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(Brand.ink.opacity(0.35))
            }
            .foregroundStyle(Brand.ink)
            .padding(.horizontal, 16).frame(height: 52)
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Brand.ink.opacity(0.12), lineWidth: 1))
        }
    }

    private var logoutButton: some View {
        Button(role: .destructive) { auth.logOut() } label: {
            HStack {
                Spacer()
                Image(systemName: "rectangle.portrait.and.arrow.right").font(.system(size: 14))
                Text("Log out").font(.dm(14, .semibold))
                Spacer()
            }
            .frame(height: 46)
            .foregroundStyle(.red)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.red.opacity(0.4), lineWidth: 1))
        }
    }
}

#Preview {
    ProfileView().environment(AuthSession())
}
