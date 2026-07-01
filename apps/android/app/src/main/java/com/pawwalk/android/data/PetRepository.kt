package com.pawwalk.android.data

/** Pets owned by the signed-in owner. */
object PetRepository {
    private val api: PawWalkApi get() = Network.api

    suspend fun list(): List<Pet> = api.getPets()

    suspend fun create(request: CreatePetRequest): Pet = api.createPet(request)

    suspend fun delete(petId: String) {
        api.deletePet(petId)
    }
}
