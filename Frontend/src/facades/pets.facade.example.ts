import { Observable } from 'rxjs';
import { petsStore, PetsState, Pet } from '../store/pets.store.example';
// import { petsService } from '../services/petsService'; // Você criará este service

/**
 * PetsFacade - Exemplo de Facade para operações com Pets
 * 
 * Este é um exemplo de como criar facades para outras entidades.
 * Adapte conforme sua API e necessidades.
 */
class PetsFacade {
    /**
     * Observable do estado de pets
     */
    get petsState$(): Observable<PetsState> {
        return petsStore.state$;
    }

    /**
     * Obtém o estado atual (snapshot)
     */
    get currentState(): PetsState {
        return petsStore.currentState;
    }

    /**
     * Carrega lista de pets com paginação
     * @param page - Número da página
     * @param size - Tamanho da página
     */
    async loadPets(page: number = 1, size: number = 10): Promise<void> {
        try {
            petsStore.setLoading(true);

            // Exemplo de chamada ao service
            // const response = await petsService.fetchPets({ page, size });
            // petsStore.setPets(response.content, page, response.totalPages);

            // Mock para demonstração
            const mockPets: Pet[] = [
                { id: 1, nome: 'Rex', raca: 'Labrador', idade: 3 },
                { id: 2, nome: 'Miau', raca: 'Siamês', idade: 2 },
            ];
            petsStore.setPets(mockPets, page, 1);
        } catch (error) {
            petsStore.setError(error instanceof Error ? error.message : 'Erro ao carregar pets');
        }
    }

    /**
     * Busca pet por ID
     * @param id - ID do pet
     */
    async getPetById(id: number): Promise<Pet | null> {
        try {
            petsStore.setLoading(true);

            // const pet = await petsService.fetchPetById(id);
            // petsStore.selectPet(pet);
            // return pet;

            // Mock
            const mockPet: Pet = { id, nome: 'Rex', raca: 'Labrador', idade: 3 };
            petsStore.selectPet(mockPet);
            petsStore.setLoading(false);
            return mockPet;
        } catch (error) {
            petsStore.setError(error instanceof Error ? error.message : 'Erro ao buscar pet');
            return null;
        }
    }

    /**
     * Cria novo pet
     * @param pet - Dados do pet
     */
    async createPet(pet: Omit<Pet, 'id'>): Promise<Pet | null> {
        try {
            petsStore.setLoading(true);

            // const newPet = await petsService.createPet(pet);
            // petsStore.addPet(newPet);
            // return newPet;

            // Mock
            const newPet: Pet = { ...pet, id: Date.now() };
            petsStore.addPet(newPet);
            petsStore.setLoading(false);
            return newPet;
        } catch (error) {
            petsStore.setError(error instanceof Error ? error.message : 'Erro ao criar pet');
            return null;
        }
    }

    /**
     * Atualiza pet existente
     * @param id - ID do pet
     * @param pet - Dados atualizados
     */
    async updatePet(id: number, pet: Partial<Pet>): Promise<Pet | null> {
        try {
            petsStore.setLoading(true);

            // const updatedPet = await petsService.updatePet(id, pet);
            // petsStore.updatePet(updatedPet);
            // return updatedPet;

            // Mock
            const updatedPet: Pet = { id, nome: 'Updated', raca: 'Updated', idade: 5, ...pet };
            petsStore.updatePet(updatedPet);
            petsStore.setLoading(false);
            return updatedPet;
        } catch (error) {
            petsStore.setError(error instanceof Error ? error.message : 'Erro ao atualizar pet');
            return null;
        }
    }

    /**
     * Deleta pet
     * @param id - ID do pet
     */
    async deletePet(id: number): Promise<boolean> {
        try {
            petsStore.setLoading(true);

            // await petsService.deletePet(id);
            // petsStore.removePet(id);

            // Mock
            petsStore.removePet(id);
            petsStore.setLoading(false);
            return true;
        } catch (error) {
            petsStore.setError(error instanceof Error ? error.message : 'Erro ao deletar pet');
            return false;
        }
    }

    /**
     * Seleciona um pet
     * @param pet - Pet a ser selecionado
     */
    selectPet(pet: Pet | null): void {
        petsStore.selectPet(pet);
    }

    /**
     * Limpa erro
     */
    clearError(): void {
        petsStore.setError(null);
    }

    /**
     * Reseta o estado
     */
    reset(): void {
        petsStore.reset();
    }
}

// Singleton instance
export const petsFacade = new PetsFacade();
