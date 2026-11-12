import React, { useState } from 'react';
import { EvolutionStage, GameItem, PartnerPokemon } from '../types/pokemon';
import { GAME_ITEMS } from '../data/itemsData';
import { POKEMON_VOICE_LINES } from '../data/pokemonData';
import { soundManager } from '../utils/audio';
import { Heart, Sparkles, X, Utensils, Plus } from 'lucide-react';

interface FeedingModalProps {
  partner: PartnerPokemon;
  currentStage: EvolutionStage;
  inventory: Record<string, number>;
  customItems?: Record<string, Partial<GameItem>>;
  onFeedItem: (item: GameItem) => void;
  onCookPoffin: () => void;
  onClose: () => void;
}

export const FeedingModal: React.FC<FeedingModalProps> = ({
  partner,
  currentStage,
  inventory,
  customItems = {},
  onFeedItem,
  onCookPoffin,
  onClose,
}) => {
  const [selectedTab, setSelectedTab] = useState<'poffin' | 'berry'>('poffin');
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [floatingEffect, setFloatingEffect] = useState<{ text: string; id: number }[]>([]);
  const [isMunching, setIsMunching] = useState<boolean>(false);

  const poffinList = Object.values(GAME_ITEMS).filter((i) => i.category === 'poffin');
  const berryList = Object.values(GAME_ITEMS).filter((i) => i.category === 'berry' || i.category === 'candy');

  const rawList = selectedTab === 'poffin' ? poffinList : berryList;

  // Merge custom modifications from admin console
  const currentList = rawList.map((item) => ({
    ...item,
    ...(customItems[item.id] || {}),
  }));

  // Handle feeding an item
  const handleFeed = (item: GameItem) => {
    const currentCount = inventory[item.id] || 0;
    if (currentCount <= 0) {
      soundManager.playClick();
      return;
    }

    // Trigger munching animation and sound
    soundManager.playFeed();
    setIsMunching(true);
    setTimeout(() => setIsMunching(false), 600);

    // Call state updater
    onFeedItem(item);

    // Add floating heart effect
    const newId = Date.now();
    const effectText = `+${item.friendshipBonus} 친밀도!`;
    setFloatingEffect((prev) => [...prev, { text: effectText, id: newId }]);
    setTimeout(() => {
      setFloatingEffect((prev) => prev.filter((e) => e.id !== newId));
    }, 1200);

    // Pick random voice line
    const voiceCategory = POKEMON_VOICE_LINES[partner.personality] || POKEMON_VOICE_LINES.warm;
    const lines = voiceCategory.fed;
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    setActiveSpeech(randomLine);
    setTimeout(() => setActiveSpeech(null), 3000);
  };

  // Check ingredients for cooking fresh poffins
  const acornCount = inventory['item-acorn'] || 0;
  const leafCount = inventory['item-leaf'] || 0;
  const canCook = acornCount >= 1 && leafCount >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors z-20"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Utensils size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 font-['Gaegu'] text-2xl">
              간식 & 포핀 카페
            </h3>
            <p className="text-xs text-slate-500">
              맛있는 포핀과 달콤한 나무열매로 {partner.nickname}와 더 친해져요!
            </p>
          </div>
        </div>

        {/* Partner Visual & Status Card */}
        <div className="relative bg-gradient-to-b from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-200/60 mb-4 flex flex-col items-center">
          {/* Floating effects */}
          {floatingEffect.map((eff) => (
            <div
              key={eff.id}
              className="absolute top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black shadow-lg animate-bounce z-30 flex items-center gap-1"
            >
              <Heart size={14} className="fill-white" />
              <span>{eff.text}</span>
            </div>
          ))}

          {/* Speech Bubble */}
          {activeSpeech && (
            <div className="absolute -top-3 max-w-[85%] px-3.5 py-1.5 rounded-2xl bg-white border border-amber-300 shadow-md text-xs font-bold text-slate-800 text-center animate-fade-in z-20">
              "{activeSpeech}"
            </div>
          )}

          {/* Sprite with eating animation */}
          <div className="relative w-28 h-28 my-1 flex items-center justify-center">
            <img
              src={partner.customSpriteUrl || currentStage.animatedSprite || currentStage.sprite}
              alt={partner.nickname}
              className={`w-24 h-24 object-contain transition-transform duration-200 drop-shadow-md pixelated ${
                isMunching ? 'scale-115 rotate-3' : 'scale-100'
              }`}
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== currentStage.sprite) {
                  target.src = currentStage.sprite;
                }
              }}
            />
            {isMunching && (
              <span className="absolute -top-2 -right-2 text-2xl animate-ping">
                💖
              </span>
            )}
          </div>

          <div className="text-center mb-2">
            <span className="font-bold text-slate-800 text-sm">{partner.nickname}</span>
            <span className="text-xs text-slate-400 ml-1.5">({currentStage.name})</span>
          </div>

          {/* Gauges: Hunger and Friendship */}
          <div className="w-full grid grid-cols-2 gap-3 text-xs">
            {/* Hunger Bar */}
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
              <div className="flex justify-between items-center mb-1 font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <span>🍽️ 배부름</span>
                </span>
                <span className="text-amber-600">{partner.hunger}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${partner.hunger}%` }}
                />
              </div>
            </div>

            {/* Friendship Bar */}
            <div className="bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <div className="flex justify-between items-center mb-1 font-bold text-slate-700">
                <span className="flex items-center gap-1 text-rose-600">
                  <Heart size={13} className="fill-rose-500 text-rose-500" />
                  <span>친밀도</span>
                </span>
                <span className="text-rose-600">{partner.friendship}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${partner.friendship}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mb-3">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedTab('poffin');
            }}
            className={`flex-1 py-2 font-bold text-xs border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              selectedTab === 'poffin'
                ? 'border-amber-500 text-amber-700 bg-amber-50/50'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>🧁 수제 포핀 (Poffin)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
              {poffinList.reduce((acc, i) => acc + (inventory[i.id] || 0), 0)}개
            </span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedTab('berry');
            }}
            className={`flex-1 py-2 font-bold text-xs border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              selectedTab === 'berry'
                ? 'border-amber-500 text-amber-700 bg-amber-50/50'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>🍓 나무열매 & 간식</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
              {berryList.reduce((acc, i) => acc + (inventory[i.id] || 0), 0)}개
            </span>
          </button>
        </div>

        {/* Food Items Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {currentList.map((item) => {
            const count = inventory[item.id] || 0;
            const hasItem = count > 0;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  hasItem
                    ? 'bg-white hover:bg-amber-50/40 border-slate-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt={item.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-2xl">{item.emoji}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">{item.name}</span>
                      {item.flavor && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                          {item.flavor}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
                    <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-600">
                      <span className="text-rose-500 font-bold">💖 +{item.friendshipBonus}</span>
                      <span className="text-amber-600 font-bold">🍽️ +{item.hungerBonus}%</span>
                      {item.stepMultiplierBonus && (
                        <span className="text-emerald-600 font-bold">
                          ⚡ 걸음 {item.stepMultiplierBonus.multiplier}배
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feeding Action Button */}
                <div className="shrink-0 text-right space-y-1">
                  <div className="text-xs font-bold text-slate-600">
                    보유: <span className={hasItem ? 'text-amber-600 font-black' : 'text-slate-400'}>{count}개</span>
                  </div>
                  <button
                    disabled={!hasItem}
                    onClick={() => handleFeed(item)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-xs ${
                      hasItem
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    먹이기
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Poffin Cooking & Info Bar */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <span>🍳 포핀 키친:</span>
              <span className="text-[11px] text-slate-500">
                도토리({acornCount}) + 나뭇잎({leafCount})
              </span>
            </span>
            <p className="text-[10px] text-slate-400">산책 중 주운 재료로 새 포핀을 만들 수 있어요</p>
          </div>
          <button
            onClick={() => {
              if (canCook) {
                soundManager.playFeed();
                onCookPoffin();
              }
            }}
            disabled={!canCook}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
              canCook
                ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus size={14} />
            <span>포핀 요리</span>
          </button>
        </div>
      </div>
    </div>
  );
};
