import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppState,
  AdminConfig,
  GameItem,
  PartnerPokemon,
  PokemonSpecies,
  EvolutionStage,
  DailyStepRecord,
} from './types/pokemon';
import { POKEMON_SPECIES_LIST } from './data/pokemonData';
import { GAME_ITEMS } from './data/itemsData';
import {
  loadAppState,
  saveAppState,
  loadAdminConfig,
  saveAdminConfig,
  updateTodaySteps,
  getTodayKey,
} from './utils/storage';
import { soundManager } from './utils/audio';
import { useFriendsSync } from './hooks/useFriendsSync';

/** Consecutive days with steps, counting back from today (or yesterday if today has none yet). */
function computeStreakDays(records: Record<string, DailyStepRecord>, todayKey: string): number {
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const day = new Date();
  if (!(records[todayKey]?.steps > 0)) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (records[toKey(day)]?.steps > 0) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

import { Navbar } from './components/Navbar';
import { WalkingScreen } from './components/WalkingScreen';
import { EvolutionModal } from './components/EvolutionModal';
import { FeedingModal } from './components/FeedingModal';
import { InventoryModal } from './components/InventoryModal';
import { PartnerSelectModal } from './components/PartnerSelectModal';
import { AdminModal } from './components/AdminModal';
import { ExploreDropModal } from './components/ExploreDropModal';
import { FriendsModal } from './components/FriendsModal';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => loadAdminConfig());

  // Modal open states
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState<boolean>(false);
  const [isFeedingModalOpen, setIsFeedingModalOpen] = useState<boolean>(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);
  const [isPartnerSelectModalOpen, setIsPartnerSelectModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState<boolean>(false);
  const [foundItemDrop, setFoundItemDrop] = useState<{ item: GameItem; count: number } | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    soundManager.setEnabled(appState.isSoundEnabled);
  }, [appState.isSoundEnabled]);

  // Secret URL or Keyboard Shortcut for Owner access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get('admin') === 'true' ||
        urlParams.get('mode') === 'admin' ||
        window.location.hash === '#admin'
      ) {
        setIsAdminModalOpen(true);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + A or Cmd + Shift + A opens Admin Console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Partner & Species resolution
  const partner = appState.partner;
  const species: PokemonSpecies = partner
    ? POKEMON_SPECIES_LIST.find((s) => s.id === partner.speciesId) || {
        id: partner.speciesId,
        basePokedexNo: 1,
        name: partner.nickname,
        nameEn: partner.nickname,
        primaryType: 'normal',
        color: '#F59E0B',
        gradient: 'from-amber-400 to-yellow-300',
        evolutionStages: [
          {
            id: `pk-${partner.speciesId}`,
            pokedexNo: 1,
            name: partner.nickname,
            nameEn: partner.nickname,
            stage: 1,
            types: ['normal'],
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
            animatedSprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif',
            portrait: 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/0025/Normal.png',
            description: `${partner.nickname}! 소중한 나의 파트너 포켓몬입니다.`,
            stepsRequired: 0,
            height: '1.0m',
            weight: '20.0kg',
            category: '포켓몬',
          },
        ],
      }
    : POKEMON_SPECIES_LIST[0];

  const currentStage: EvolutionStage = species.evolutionStages[partner ? Math.min(partner.currentStageIndex, species.evolutionStages.length - 1) : 0];
  const nextStage: EvolutionStage | null =
    partner && partner.currentStageIndex < species.evolutionStages.length - 1
      ? species.evolutionStages[partner.currentStageIndex + 1]
      : null;

  // Track exploration drop interval
  const exploreStepCounterRef = useRef<number>(0);

  // Check and trigger item drops while walking
  const checkExplorationDrop = useCallback((stepsAdded: number) => {
    exploreStepCounterRef.current += stepsAdded;
    const threshold = adminConfig.stepsPerExplore || 1000;

    if (exploreStepCounterRef.current >= threshold) {
      exploreStepCounterRef.current = 0;
      const dropPool = [
        'poffin-spicy',
        'poffin-dry',
        'poffin-sweet',
        'poffin-sour',
        'poffin-bitter',
        'berry-razz',
        'berry-nanab',
        'berry-pinap',
        'berry-golden-razz',
        'item-leaf',
        'item-acorn',
        'item-stardust',
      ];
      const randomItemId = dropPool[Math.floor(Math.random() * dropPool.length)];
      const item = GAME_ITEMS[randomItemId];
      if (item) {
        soundManager.playItemFound();
        setAppState((prev) => ({
          ...prev,
          inventory: {
            ...prev.inventory,
            [randomItemId]: (prev.inventory[randomItemId] || 0) + 1,
          },
        }));
        setFoundItemDrop({ item, count: 1 });
      }
    }
  }, [adminConfig.stepsPerExplore]);

  // Check if eligible for evolution
  const checkEvolutionEligibility = useCallback((updatedPartner: PartnerPokemon) => {
    if (!nextStage) return;
    if (updatedPartner.isEverstoneEquipped) return;

    if (updatedPartner.totalStepsWalked >= nextStage.stepsRequired) {
      setIsEvolutionModalOpen(true);
    }
  }, [nextStage]);

  // Add steps (from real accelerometer sensor, walking, or manual button)
  const handleAddSteps = useCallback((rawSteps: number) => {
    let effectiveMultiplier = adminConfig.stepMultiplier || 1.0;
    if (appState.activeBuff && Date.now() < appState.activeBuff.expiresAt) {
      effectiveMultiplier *= appState.activeBuff.multiplier;
    }

    const stepsToAdd = Math.max(1, Math.round(rawSteps * effectiveMultiplier));

    setAppState((prev) => {
      const updated = updateTodaySteps(prev, stepsToAdd);
      if (updated.partner) {
        checkEvolutionEligibility(updated.partner);
      }
      return updated;
    });

    checkExplorationDrop(stepsToAdd);
  }, [adminConfig.stepMultiplier, appState.activeBuff, checkEvolutionEligibility, checkExplorationDrop]);

  // Toggle Sound
  const handleToggleSound = () => {
    const nextVal = !appState.isSoundEnabled;
    soundManager.setEnabled(nextVal);
    if (nextVal) soundManager.playClick();
    setAppState((prev) => ({ ...prev, isSoundEnabled: nextVal }));
  };

  // Trigger Evolution manually or automatically
  const handleTriggerEvolution = () => {
    if (!nextStage) return;
    setIsEvolutionModalOpen(true);
  };

  // Evolution finished successfully
  const handleCompleteEvolution = () => {
    if (!partner || !nextStage) return;
    const nextIndex = partner.currentStageIndex + 1;
    const nextStageData = species.evolutionStages[nextIndex];

    setAppState((prev) => {
      if (!prev.partner) return prev;
      return {
        ...prev,
        partner: {
          ...prev.partner,
          currentStageIndex: nextIndex,
          nickname:
            prev.partner.nickname === currentStage.name
              ? nextStageData.name
              : prev.partner.nickname,
          friendship: Math.min(100, prev.partner.friendship + 20),
        },
      };
    });
    setIsEvolutionModalOpen(false);
  };

  // Evolution stopped via B-Button!
  const handleCancelEvolution = (equipEverstone: boolean) => {
    if (equipEverstone && partner) {
      setAppState((prev) => {
        if (!prev.partner) return prev;
        return {
          ...prev,
          partner: {
            ...prev.partner,
            isEverstoneEquipped: true,
          },
          inventory: {
            ...prev.inventory,
            'stone-everstone': Math.max(1, prev.inventory['stone-everstone'] || 1),
          },
        };
      });
    }
    setIsEvolutionModalOpen(false);
  };

  // Toggle Everstone
  const handleToggleEverstone = () => {
    setAppState((prev) => {
      if (!prev.partner) return prev;
      const nextEquipped = !prev.partner.isEverstoneEquipped;
      return {
        ...prev,
        partner: {
          ...prev.partner,
          isEverstoneEquipped: nextEquipped,
        },
      };
    });
  };

  // Feed an Item (Poffin or Berry)
  const handleFeedItem = (item: GameItem) => {
    setAppState((prev) => {
      if (!prev.partner) return prev;
      const currentCount = prev.inventory[item.id] || 0;
      if (currentCount <= 0) return prev;

      const newInventory = {
        ...prev.inventory,
        [item.id]: currentCount - 1,
      };

      let activeBuff = prev.activeBuff;
      if (item.stepMultiplierBonus) {
        activeBuff = {
          multiplier: item.stepMultiplierBonus.multiplier,
          expiresAt: Date.now() + item.stepMultiplierBonus.durationMinutes * 60 * 1000,
          description: `${item.name} 효과 (${item.stepMultiplierBonus.multiplier}배)`,
        };
      }

      let extraSteps = 0;
      if (item.id === 'candy-rare') {
        extraSteps = 2000;
      }

      const updatedPartner: PartnerPokemon = {
        ...prev.partner,
        hunger: Math.min(100, prev.partner.hunger + item.hungerBonus),
        friendship: Math.min(100, prev.partner.friendship + item.friendshipBonus),
        totalStepsWalked: prev.partner.totalStepsWalked + extraSteps,
      };

      if (extraSteps > 0) {
        checkEvolutionEligibility(updatedPartner);
      }

      return {
        ...prev,
        inventory: newInventory,
        partner: updatedPartner,
        activeBuff,
      };
    });
  };

  // Use Rare Candy from Inventory modal
  const handleUseRareCandy = () => {
    const rareCandy = GAME_ITEMS['candy-rare'];
    if (rareCandy) {
      handleFeedItem(rareCandy);
    }
  };

  // Cook / craft fresh Poffin from gathered acorns & leaves
  const handleCookPoffin = () => {
    setAppState((prev) => {
      const acorns = prev.inventory['item-acorn'] || 0;
      const leaves = prev.inventory['item-leaf'] || 0;
      if (acorns < 1 || leaves < 1) return prev;

      const poffinChoices = ['poffin-sweet', 'poffin-spicy', 'poffin-dry', 'poffin-sour', 'poffin-bitter'];
      const craftedId = poffinChoices[Math.floor(Math.random() * poffinChoices.length)];

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          'item-acorn': acorns - 1,
          'item-leaf': leaves - 1,
          [craftedId]: (prev.inventory[craftedId] || 0) + 1,
        },
      };
    });
  };

  // Select new starter partner
  const handleSelectPartner = (newSpecies: PokemonSpecies, nickname: string, personality: any) => {
    const newPartner: PartnerPokemon = {
      speciesId: newSpecies.id,
      currentStageIndex: 0,
      nickname,
      personality,
      friendship: 40,
      hunger: 80,
      isEverstoneEquipped: false,
      totalStepsWalked: 0,
      joinedAt: new Date().toISOString(),
      shiny: false,
    };

    setAppState((prev) => ({
      ...prev,
      partner: newPartner,
    }));
  };

  const handleUpdateTrainerName = (newName: string) => {
    setAppState((prev) => ({
      ...prev,
      trainerName: newName,
    }));
  };

  // Admin Custom Item update
  const handleUpdateCustomItem = (itemId: string, updated: Partial<GameItem>) => {
    setAppState((prev) => ({
      ...prev,
      customItems: {
        ...prev.customItems,
        [itemId]: {
          ...(prev.customItems[itemId] || {}),
          ...updated,
        },
      },
    }));
  };

  const handleResetCustomItems = () => {
    setAppState((prev) => ({
      ...prev,
      customItems: {},
    }));
  };

  // ADMIN CONTROLS
  const handleForceEvolve = () => {
    if (nextStage) {
      setIsEvolutionModalOpen(true);
    } else {
      alert('이미 최종 진화 단계입니다.');
    }
  };

  const handleRollbackEvolution = () => {
    setAppState((prev) => {
      if (!prev.partner) return prev;
      return {
        ...prev,
        partner: {
          ...prev.partner,
          currentStageIndex: 0,
          totalStepsWalked: 0,
        },
      };
    });
  };

  const handleFillInventory = () => {
    setAppState((prev) => {
      const updatedInv = { ...prev.inventory };
      Object.keys(GAME_ITEMS).forEach((id) => {
        updatedInv[id] = 99;
      });
      return {
        ...prev,
        inventory: updatedInv,
      };
    });
  };

  const handleMaxFriendshipHunger = () => {
    setAppState((prev) => {
      if (!prev.partner) return prev;
      return {
        ...prev,
        partner: {
          ...prev.partner,
          friendship: 100,
          hunger: 100,
        },
      };
    });
  };

  const handleResetAllData = () => {
    localStorage.clear();
    const freshState = loadAppState();
    setAppState(freshState);
  };

  // Today step record
  const todayKey = getTodayKey();
  const todayRecord = appState.stepRecords[todayKey] || {
    date: todayKey,
    steps: 0,
    distanceKm: 0,
    caloriesBurned: 0,
  };

  // Real friends (Firebase): publish my profile, stream friends while the friends screen is open
  const friendsSync = useFriendsSync({
    profile: {
      code: appState.trainerCode,
      name: appState.trainerName,
      partnerName: partner?.nickname ?? '',
      partnerPokedexNo: currentStage.pokedexNo,
      partnerStageName: currentStage.name,
      partnerSprite: currentStage.animatedSprite || currentStage.sprite,
      todaySteps: todayRecord.steps,
      todayKey,
      totalSteps: appState.totalSteps,
      streakDays: computeStreakDays(appState.stepRecords, todayKey),
    },
    onCodeAssigned: (code) => setAppState((prev) => ({ ...prev, trainerCode: code })),
    watchFriends: isFriendsModalOpen,
  });

  return (
    <div
      className="min-h-screen text-slate-900 transition-colors duration-500 font-sans selection:bg-amber-300 selection:text-amber-900"
      style={{ backgroundColor: appState.themeBackground || '#FFF9E6' }}
    >
      {/* Top Navbar */}
      <Navbar
        partner={partner}
        isSoundEnabled={appState.isSoundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenPartnerSelect={() => setIsPartnerSelectModalOpen(true)}
        onOpenFriends={() => setIsFriendsModalOpen(true)}
      />

      {/* Main Walking Screen */}
      {partner && (
        <main>
          <WalkingScreen
            partner={partner}
            species={species}
            currentStage={currentStage}
            nextStage={nextStage}
            todayRecord={todayRecord}
            totalSteps={appState.totalSteps}
            onAddSteps={handleAddSteps}
            onTriggerEvolution={handleTriggerEvolution}
            onOpenFeeding={() => setIsFeedingModalOpen(true)}
            onOpenInventory={() => setIsInventoryModalOpen(true)}
            onOpenPartnerSelect={() => setIsPartnerSelectModalOpen(true)}
            onOpenFriends={() => setIsFriendsModalOpen(true)}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
          />
        </main>
      )}

      {/* Evolution Modal (With B-Button Stop & Everstone Protection) */}
      {isEvolutionModalOpen && partner && nextStage && (
        <EvolutionModal
          species={species}
          currentStage={currentStage}
          targetStage={nextStage}
          partner={partner}
          onCompleteEvolution={handleCompleteEvolution}
          onCancelEvolution={handleCancelEvolution}
        />
      )}

      {/* Feeding Modal (Poffins & Berries with custom item support) */}
      {isFeedingModalOpen && partner && (
        <FeedingModal
          partner={partner}
          currentStage={currentStage}
          inventory={appState.inventory}
          customItems={appState.customItems}
          onFeedItem={handleFeedItem}
          onCookPoffin={handleCookPoffin}
          onClose={() => setIsFeedingModalOpen(false)}
        />
      )}

      {/* Inventory & Everstone Modal */}
      {isInventoryModalOpen && (
        <InventoryModal
          partner={partner}
          inventory={appState.inventory}
          onToggleEverstone={handleToggleEverstone}
          onUseRareCandy={handleUseRareCandy}
          onClose={() => setIsInventoryModalOpen(false)}
        />
      )}

      {/* Partner Pokemon Selection & Live Search (Gen 1~9, all 1025 Pokemon) */}
      {isPartnerSelectModalOpen && (
        <PartnerSelectModal
          currentPartner={partner}
          onSelectPartner={handleSelectPartner}
          onClose={() => setIsPartnerSelectModalOpen(false)}
        />
      )}

      {/* Friends & Walking Sharing Modal */}
      {isFriendsModalOpen && (
        <FriendsModal
          myTrainerCode={friendsSync.myCode}
          myTrainerName={appState.trainerName}
          myPartner={partner}
          myCurrentStage={currentStage}
          myTodaySteps={todayRecord.steps}
          todayKey={todayKey}
          syncStatus={friendsSync.status}
          syncError={friendsSync.errorMessage}
          friends={friendsSync.friends}
          friendCount={friendsSync.friendCount}
          receivedCheers={friendsSync.receivedCheers}
          sentCheers={friendsSync.sentCheers}
          onAddFriend={friendsSync.addFriend}
          onRemoveFriend={friendsSync.removeFriend}
          onCheerFriend={friendsSync.cheer}
          onUpdateTrainerName={handleUpdateTrainerName}
          onClose={() => setIsFriendsModalOpen(false)}
        />
      )}

      {/* Operator Admin Console Modal */}
      {isAdminModalOpen && (
        <AdminModal
          adminConfig={adminConfig}
          partner={partner}
          customItems={appState.customItems}
          onUpdateAdminConfig={(cfg) => {
            setAdminConfig(cfg);
            saveAdminConfig(cfg);
          }}
          onUpdateCustomItem={handleUpdateCustomItem}
          onResetCustomItems={handleResetCustomItems}
          onAddSteps={handleAddSteps}
          onForceEvolve={handleForceEvolve}
          onRollbackEvolution={handleRollbackEvolution}
          onToggleEverstone={handleToggleEverstone}
          onFillInventory={handleFillInventory}
          onMaxFriendshipHunger={handleMaxFriendshipHunger}
          onResetAllData={handleResetAllData}
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}

      {/* Exploration Item Drop Pop-up */}
      {foundItemDrop && partner && (
        <ExploreDropModal
          item={foundItemDrop.item}
          count={foundItemDrop.count}
          partnerName={partner.nickname}
          onClose={() => setFoundItemDrop(null)}
        />
      )}
    </div>
  );
}
