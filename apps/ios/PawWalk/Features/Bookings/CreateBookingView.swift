import SwiftUI

/// Small booking-creation form, presented as a sheet when tapping a walker in
/// `WalkersView`. On success, hands the new booking off via `onBooked` so the
/// caller can switch to the Bookings tab.
struct CreateBookingView: View {
    let walker: Walker
    var onBooked: (Booking) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var dogName = ""
    @State private var pets: [Pet] = []
    @State private var startTime = Date().addingTimeInterval(3600)
    @State private var durationMinutes = 30
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private let durations = [30, 45, 60]

    var body: some View {
        NavigationStack {
            Form {
                Section("Walker") {
                    Text(walker.name).font(.dm(15, .semibold))
                }
                Section("Walk details") {
                    if pets.isEmpty {
                        TextField("Dog's name", text: $dogName)
                    } else {
                        Picker("Pet", selection: $dogName) {
                            ForEach(pets) { Text($0.name).tag($0.name) }
                        }
                    }
                    DatePicker("Start time", selection: $startTime, in: Date()...)
                    Picker("Duration", selection: $durationMinutes) {
                        ForEach(durations, id: \.self) { Text("\($0) min").tag($0) }
                    }
                    .pickerStyle(.segmented)
                }
                if let errorMessage {
                    Text(errorMessage).font(.dm(12)).foregroundStyle(.red)
                }
            }
            .navigationTitle("Book \(walker.name)")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                pets = (try? await APIClient.shared.pets()) ?? []
                if dogName.isEmpty, let first = pets.first { dogName = first.name }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Book") { Task { await submit() } }
                        .disabled(dogName.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
            .disabled(isSubmitting)
        }
    }

    private func submit() async {
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }
        let request = CreateBookingRequest(
            walkerID: walker.id,
            dogName: dogName.trimmingCharacters(in: .whitespaces),
            startTime: startTime,
            durationMinutes: durationMinutes,
            notes: nil
        )
        do {
            let booking = try await APIClient.shared.createBooking(request)
            dismiss()
            onBooked(booking)
        } catch {
            errorMessage = "Couldn't create the booking. Try again."
        }
    }
}

#Preview {
    CreateBookingView(
        walker: Walker(id: "wlk_preview", name: "Sam Rivera", photoURL: nil, rating: 4.9,
                       pricePer30MinCents: 1800, bio: "Preview walker",
                       neighborhoods: ["Mission", "SoMa"]),
        onBooked: { _ in }
    )
}
