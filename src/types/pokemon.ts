export type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric' 
  | 'ice' | 'fighting' | 'poison' | 'ground' | 'flying' 
  | 'psychic' | 'bug' | 'rock' | 'ghost' | 'dragon' 
  | 'steel' | 'fairy';

export interface EvolutionStage {
  id: string;
  pokedexNo: number;
  name: string;
  nameEn: string;
  stage: number; // 1, 2, 3
  types: PokemonType[];
  sprite: string;
  animatedSprite: string;
  portrait?: string;
  description: string;
  stepsRequired: number; // Total cumulative steps needed to reach this stage
  height: string;
  weight: string;
  category: string;
}

export type PersonalityKey = 'warm' | 'lively' | 'calm' | 'shy' | 'brave' | 'playful';

export interface Personality {
  key: PersonalityKey;
  label: string;
  desc: string;
  badge: string;
}

export interface PokemonSpecies {
  id: string;
  basePokedexNo: number;
  name: string;
  nameEn: string;
  primaryType: PokemonType;
  color: string;
  gradient: string;
  evolutionStages: EvolutionStage[];
  customEvolutions?: {
    stoneId?: string;
    branchStages: EvolutionStage[];
  };
}

export interface PartnerPokemon {
  speciesId: string;
  currentStageIndex: number;
  nickname: string;
  personality: PersonalityKey;
  friendship: number; // 0 - 100
  hunger: number; // 0 - 100 (100 = full)
  isEverstoneEquipped: boolean; // Prevents evolution
  totalStepsWalked: number;
  joinedAt: string;
  shiny?: boolean;
  customSpriteUrl?: string;
}

export type ItemCategory = 'poffin' | 'berry' | 'candy' | 'stone' | 'collectible';

export interface GameItem {
  id: string;
  name: string;
  category: ItemCategory;
  emoji: string;
  iconUrl?: string;
  desc: string;
  flavor?: string;
  rarity: 1 | 2 | 3 | 4;
  friendshipBonus: number;
  hungerBonus: number;
  stepMultiplierBonus?: {
    multiplier: number;
    durationMinutes: number;
  };
  specialEffect?: 'evolve' | 'prevent_evolve' | 'level_up' | 'super_friendship';
}

export interface UserInventoryItem {
  itemId: string;
  count: number;
}

export interface DailyStepRecord {
  date: string; // YYYY-MM-DD
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
}

export interface FriendTrainer {
  code: string;
  name: string;
  partnerName: string;
  partnerPokedexNo: number;
  partnerStageName: string;
  partnerSprite: string;
  todaySteps: number;
  totalSteps: number;
  streakDays: number;
  isCheeredToday?: boolean;
  lastUpdated?: string;
}

export interface AppState {
  partner: PartnerPokemon | null;
  totalSteps: number;
  inventory: Record<string, number>;
  customItems: Record<string, Partial<GameItem>>;
  stepRecords: Record<string, DailyStepRecord>;
  unlockedFeatures: string[];
  themeBackground: string;
  isSoundEnabled: boolean;
  trainerCode: string;
  trainerName: string;
  friends: FriendTrainer[];
  activeBuff?: {
    multiplier: number;
    expiresAt: number;
    description: string;
  };
}

export interface AdminConfig {
  adminPin: string; // Hashed or plaintext PIN (default "0000")
  stepMultiplier: number;
  stepsPerExplore: number;
  fastEvolutionMode: boolean;
  debugMode: boolean;
}
