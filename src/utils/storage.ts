import { AppState, AdminConfig, PartnerPokemon, DailyStepRecord, FriendTrainer } from '../types/pokemon';
import { INITIAL_INVENTORY, GAME_ITEMS } from '../data/itemsData';

const APP_STATE_KEY = 'pokestep_app_state_v3';
const ADMIN_CONFIG_KEY = 'pokestep_admin_config_v3';
const LEGACY_PIN_KEY = 'walkmate-admin-pin-v1';

export function generateTrainerCode(): string {
  const p1 = Math.floor(1000 + Math.random() * 9000);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  return `PK-${p1}-${p2}`;
}

export const DEFAULT_COMMUNITY_FRIENDS: FriendTrainer[] = [
  {
    code: 'PK-ASH-0025',
    name: '지우 (Ash)',
    partnerName: '피카츄',
    partnerPokedexNo: 25,
    partnerStageName: '피카츄',
    partnerSprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif',
    todaySteps: 7850,
    totalSteps: 124500,
    streakDays: 14,
    isCheeredToday: false,
  },
  {
    code: 'PK-DAWN-0393',
    name: '빛나 (Dawn)',
    partnerName: '팽도리',
    partnerPokedexNo: 393,
    partnerStageName: '팽도리',
    partnerSprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/393.gif',
    todaySteps: 5420,
    totalSteps: 89300,
    streakDays: 8,
    isCheeredToday: false,
  },
  {
    code: 'PK-CYNTHIA-0445',
    name: '난천 (Cynthia)',
    partnerName: '한카리아스',
    partnerPokedexNo: 445,
    partnerStageName: '한카리아스',
    partnerSprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/445.gif',
    todaySteps: 11200,
    totalSteps: 345000,
    streakDays: 32,
    isCheeredToday: false,
  },
];

// Default starter Pokemon (Pichu #172)
const DEFAULT_PARTNER: PartnerPokemon = {
  speciesId: 'pikachu-line',
  currentStageIndex: 0,
  nickname: '피츄',
  personality: 'lively',
  friendship: 30,
  hunger: 70,
  isEverstoneEquipped: false,
  totalStepsWalked: 0,
  joinedAt: new Date().toISOString(),
  shiny: false,
};

const DEFAULT_STATE: AppState = {
  partner: DEFAULT_PARTNER,
  totalSteps: 0,
  inventory: { ...INITIAL_INVENTORY },
  customItems: {},
  stepRecords: {},
  unlockedFeatures: ['start', 'lines', 'feed', 'search'],
  themeBackground: '#FFF9E6',
  isSoundEnabled: true,
  trainerCode: generateTrainerCode(),
  trainerName: '초보 트레이너',
  friends: DEFAULT_COMMUNITY_FRIENDS,
};

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  adminPin: '0000',
  stepMultiplier: 1.0,
  stepsPerExplore: 1000,
  fastEvolutionMode: false,
  debugMode: false,
};

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (parsed.partner?.customSpriteUrl?.includes('PMDCollab/SpriteCollab/master/portrait')) {
      delete parsed.partner.customSpriteUrl;
    }
    return {
      ...DEFAULT_STATE,
      ...parsed,
      trainerCode: parsed.trainerCode || generateTrainerCode(),
      trainerName: parsed.trainerName || '트레이너',
      friends: parsed.friends && parsed.friends.length > 0 ? parsed.friends : DEFAULT_COMMUNITY_FRIENDS,
      customItems: parsed.customItems || {},
      inventory: { ...INITIAL_INVENTORY, ...parsed.inventory },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save app state to localStorage', err);
  }
}

export function loadAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (!raw) {
      const legacyPin = localStorage.getItem(LEGACY_PIN_KEY);
      if (legacyPin) {
        return { ...DEFAULT_ADMIN_CONFIG, adminPin: legacyPin };
      }
      return DEFAULT_ADMIN_CONFIG;
    }
    return { ...DEFAULT_ADMIN_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ADMIN_CONFIG;
  }
}

export function saveAdminConfig(config: AdminConfig): void {
  try {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save admin config', err);
  }
}

export const OWNER_DEVICE_KEY = 'pokestep_is_owner_device';

export function isOwnerDevice(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get('admin') === 'true' ||
        urlParams.get('mode') === 'admin' ||
        window.location.hash === '#admin'
      ) {
        localStorage.setItem(OWNER_DEVICE_KEY, 'true');
        return true;
      }
    }
    return localStorage.getItem(OWNER_DEVICE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOwnerDevice(isOwner: boolean): void {
  try {
    if (isOwner) {
      localStorage.setItem(OWNER_DEVICE_KEY, 'true');
    } else {
      localStorage.removeItem(OWNER_DEVICE_KEY);
    }
  } catch {}
}

export function verifyAdminPin(inputPin: string): boolean {
  const config = loadAdminConfig();
  // Only the configured PIN is accepted (default 0000 until the owner changes it)
  return config.adminPin === inputPin.trim();
}

export function resetAdminPin(): void {
  const config = loadAdminConfig();
  config.adminPin = '0000';
  saveAdminConfig(config);
  try {
    localStorage.removeItem(LEGACY_PIN_KEY);
  } catch {}
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function updateTodaySteps(state: AppState, addedSteps: number): AppState {
  const todayKey = getTodayKey();
  const existingToday = state.stepRecords[todayKey] || {
    date: todayKey,
    steps: 0,
    distanceKm: 0,
    caloriesBurned: 0,
  };

  const newTodaySteps = existingToday.steps + addedSteps;
  const newDistanceKm = +(newTodaySteps * 0.00075).toFixed(2);
  const newCalories = Math.round(newTodaySteps * 0.04);

  const updatedRecord: DailyStepRecord = {
    date: todayKey,
    steps: newTodaySteps,
    distanceKm: newDistanceKm,
    caloriesBurned: newCalories,
  };

  const partner = state.partner ? {
    ...state.partner,
    totalStepsWalked: state.partner.totalStepsWalked + addedSteps,
    hunger: Math.max(0, state.partner.hunger - Math.floor(addedSteps / 200)),
    friendship: Math.min(100, state.partner.friendship + Math.floor(addedSteps / 500)),
  } : null;

  return {
    ...state,
    totalSteps: state.totalSteps + addedSteps,
    partner,
    stepRecords: {
      ...state.stepRecords,
      [todayKey]: updatedRecord,
    },
  };
}
