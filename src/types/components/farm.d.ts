import type { Building, FarmAnimal } from "stardew-valley-data";
import type {
  BuildingProgress,
  FarmAnimalProgress,
  PetProgress,
} from "../app/game";

export interface AnimalCardProps {
  animal: FarmAnimalProgress;
  species: FarmAnimal | undefined;
  onClick: () => void;
}

export interface FishPondInfo {
  name: string;
  image: string | null;
  currentOccupants: number;
  maxOccupants: number;
}

export interface BuildingCardProps {
  building: BuildingProgress;
  buildingData: Building | undefined;
  animals: FarmAnimalProgress[];
  fishPond?: FishPondInfo;
  onClick: () => void;
}
