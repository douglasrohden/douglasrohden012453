import { petsStore, PetsState } from '../store/pets.store.example';
import { petsFacade } from '../facades/pets.facade.example';
import { useObservable } from './useObservable';

const initialPetsState: PetsState = {
    pets: [],
    selectedPet: null,
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
};

/**
 * Hook customizado para usar o PetsFacade em componentes React
 * 
 * Exemplo de uso:
 * ```tsx
 * function PetsListPage() {
 *     const { pets, isLoading, error, loadPets, deletePet } = usePetsFacade();
 * 
 *     useEffect(() => {
 *         loadPets(1, 10);
 *     }, []);
 * 
 *     if (isLoading) return <div>Carregando...</div>;
 *     if (error) return <div>Erro: {error}</div>;
 * 
 *     return (
 *         <div>
 *             {pets.map(pet => (
 *                 <div key={pet.id}>
 *                     <h3>{pet.nome}</h3>
 *                     <button onClick={() => deletePet(pet.id)}>Deletar</button>
 *                 </div>
 *             ))}
 *         </div>
 *     );
 * }
 * ```
 */
export function usePetsFacade() {
    // Subscreve ao estado reativo do store
    const petsState = useObservable(petsStore.state$, initialPetsState);

    return {
        // Estado reativo
        pets: petsState.pets,
        selectedPet: petsState.selectedPet,
        currentPage: petsState.currentPage,
        totalPages: petsState.totalPages,
        isLoading: petsState.isLoading,
        error: petsState.error,

        // Métodos do facade
        loadPets: petsFacade.loadPets.bind(petsFacade),
        getPetById: petsFacade.getPetById.bind(petsFacade),
        createPet: petsFacade.createPet.bind(petsFacade),
        updatePet: petsFacade.updatePet.bind(petsFacade),
        deletePet: petsFacade.deletePet.bind(petsFacade),
        selectPet: petsFacade.selectPet.bind(petsFacade),
        clearError: petsFacade.clearError.bind(petsFacade),
        reset: petsFacade.reset.bind(petsFacade),
    };
}
