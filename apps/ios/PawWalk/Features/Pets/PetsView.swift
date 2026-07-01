import SwiftUI
import Observation

@MainActor
@Observable
final class PetsViewModel {
    enum ViewState { case loading, loaded([Pet]), failed(String) }
    private(set) var state: ViewState = .loading

    func load() async {
        state = .loading
        do { state = .loaded(try await APIClient.shared.pets()) }
        catch { state = .failed("Couldn't load your pets. Pull to refresh.") }
    }

    func add(_ request: CreatePetRequest) async {
        _ = try? await APIClient.shared.createPet(request)
        await load()
    }

    func delete(_ pet: Pet) async {
        try? await APIClient.shared.deletePet(id: pet.id)
        await load()
    }
}

/// Owner's pets — add / list / delete. The booking form reads from the same list.
struct PetsView: View {
    @State private var model = PetsViewModel()
    @State private var showAdd = false

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Your pets")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        Button { showAdd = true } label: { Image(systemName: "plus") }
                    }
                }
                .task { await model.load() }
                .sheet(isPresented: $showAdd) {
                    AddPetView { req in
                        Task { await model.add(req); showAdd = false }
                    }
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .loading:
            ProgressView("Loading pets…")
        case .failed(let message):
            ContentUnavailableView("Couldn't load pets", systemImage: "exclamationmark.triangle", description: Text(message))
        case .loaded(let pets) where pets.isEmpty:
            ContentUnavailableView {
                Label("No pets yet", systemImage: "pawprint")
            } description: {
                Text("Add your dog so you can book walks for them.")
            } actions: {
                Button("Add a pet") { showAdd = true }
            }
        case .loaded(let pets):
            List {
                ForEach(pets) { pet in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(pet.name).font(.dm(15, .semibold)).foregroundStyle(Brand.ink)
                        if !pet.subtitle.isEmpty {
                            MonoCaption(pet.subtitle, size: 10, weight: .regular, tracking: 0.06, color: Brand.ink.opacity(0.6))
                        }
                    }
                    .padding(.vertical, 4)
                }
                .onDelete { indexSet in
                    for i in indexSet { Task { await model.delete(pets[i]) } }
                }
            }
            .listStyle(.plain)
            .refreshable { await model.load() }
        }
    }
}

private struct AddPetView: View {
    var onSave: (CreatePetRequest) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var breed = ""
    @State private var age = ""
    @State private var weight = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Pet") {
                    TextField("Name", text: $name)
                    TextField("Breed", text: $breed)
                    TextField("Age (years)", text: $age).keyboardType(.decimalPad)
                    TextField("Weight (kg)", text: $weight).keyboardType(.decimalPad)
                }
            }
            .navigationTitle("Add a pet")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(CreatePetRequest(
                            name: name.trimmingCharacters(in: .whitespaces),
                            breed: breed.trimmingCharacters(in: .whitespaces),
                            ageYears: Double(age),
                            weightKg: Double(weight),
                            notes: nil
                        ))
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}

#Preview { PetsView() }
