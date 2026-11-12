import React, { useState, useEffect } from 'react';
import { PersonalityKey, PokemonSpecies, PartnerPokemon } from '../types/pokemon';
import { POKEMON_SPECIES_LIST, PERSONALITIES } from '../data/pokemonData';
import { searchOrFetchPokemon, KOREAN_POKEMON_MAP } from '../utils/pokedexService';
import { soundManager } from '../utils/audio';
import { X, Check, Search, Sparkles, Loader2, Globe } from 'lucide-react';

interface PartnerSelectModalProps {
  currentPartner: PartnerPokemon | null;
  onSelectPartner: (species: PokemonSpecies, nickname: string, personality: PersonalityKey) => void;
  onClose: () => void;
}

export const PartnerSelectModal: React.FC<PartnerSelectModalProps> = ({
  currentPartner,
  onSelectPartner,
  onClose,
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<PokemonSpecies>(
    () =>
      POKEMON_SPECIES_LIST.find((s) => s.id === currentPartner?.speciesId) ||
      POKEMON_SPECIES_LIST[0]
  );
  const [nickname, setNickname] = useState<string>(
    currentPartner?.nickname || selectedSpecies.evolutionStages[0].name
  );
  const [personality, setPersonality] = useState<PersonalityKey>(
    currentPartner?.personality || 'warm'
  );

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);
  const [liveSearchResult, setLiveSearchResult] = useState<PokemonSpecies | null>(null);
  const [activeGenFilter, setActiveGenFilter] = useState<number | 'all'>('all');

  // Debounced live PokeAPI search for all 1025 Pokemon
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setLiveSearchResult(null);
      setIsSearchingLive(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      const result = await searchOrFetchPokemon(q);
      setLiveSearchResult(result);
      setIsSearchingLive(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSpeciesChange = (species: PokemonSpecies) => {
    soundManager.playClick();
    setSelectedSpecies(species);
    setNickname(species.evolutionStages[0].name);
  };

  const handleConfirm = () => {
    soundManager.playLevelUp();
    onSelectPartner(
      selectedSpecies,
      nickname.trim() || selectedSpecies.evolutionStages[0].name,
      personality
    );
    onClose();
  };

  // Filter local species
  const filteredSpecies = POKEMON_SPECIES_LIST.filter((sp) => {
    if (activeGenFilter !== 'all') {
      const baseNo = sp.basePokedexNo;
      if (activeGenFilter === 1 && (baseNo < 1 || baseNo > 151)) return false;
      if (activeGenFilter === 2 && (baseNo < 152 || baseNo > 251)) return false;
      if (activeGenFilter === 3 && (baseNo < 252 || baseNo > 386)) return false;
      if (activeGenFilter === 4 && (baseNo < 387 || baseNo > 493)) return false;
      if (activeGenFilter === 5 && (baseNo < 494 || baseNo > 649)) return false;
      if (activeGenFilter === 6 && (baseNo < 650 || baseNo > 721)) return false;
      if (activeGenFilter === 7 && (baseNo < 722 || baseNo > 809)) return false;
      if (activeGenFilter === 8 && (baseNo < 810 || baseNo > 905)) return false;
      if (activeGenFilter === 9 && (baseNo < 906 || baseNo > 1025)) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Close */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-800 font-['Gaegu'] text-2xl">
              포켓몬 검색 및 파트너 선택
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              전국도감 1~1,025번
            </span>
          </div>
          <p className="text-xs text-slate-500">
            한국어 이름, 영문명, 도감 번호로 거의 모든 포켓몬을 자유롭게 검색해보세요!
          </p>
        </div>

        {/* SEARCH BAR (ALL POKEMON) */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="포켓몬 검색 (예: 뮤츠, 개굴닌자, 루카리오, 따라큐, 150...)"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden"
          />
          {isSearchingLive ? (
            <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-500 animate-spin" />
          ) : searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* GENERATION FILTER PILLS */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 no-scrollbar text-xs">
          <button
            onClick={() => setActiveGenFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
              activeGenFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
            <button
              key={gen}
              onClick={() => setActiveGenFilter(gen)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                activeGenFilter === gen
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {gen}세대
            </button>
          ))}
        </div>

        {/* POKEMON SELECTION GRID / LIVE SEARCH RESULTS */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* If Search Query Active: Show Live Search Result */}
          {searchQuery ? (
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-2">
                검색 결과:
              </span>
              {liveSearchResult ? (
                <div
                  onClick={() => handleSpeciesChange(liveSearchResult)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedSpecies.basePokedexNo === liveSearchResult.basePokedexNo
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300'
                      : 'border-slate-200 bg-white hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        liveSearchResult.evolutionStages[0].animatedSprite ||
                        liveSearchResult.evolutionStages[0].sprite
                      }
                      alt={liveSearchResult.name}
                      style={{ imageRendering: 'pixelated' }}
                      className="w-14 h-14 object-contain drop-shadow-md pixelated"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {liveSearchResult.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          #{liveSearchResult.basePokedexNo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {liveSearchResult.evolutionStages[0].description}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-bold text-xs shrink-0">
                    선택
                  </span>
                </div>
              ) : !isSearchingLive ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                  해당 이름이나 번호의 포켓몬을 찾을 수 없습니다. 정확한 한국어 이름이나 전국도감 번호(1~1025)를 입력해보세요.
                </div>
              ) : null}
            </div>
          ) : (
            /* Curated Starter & Beloved Pokemon Grid */
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                포켓몬 목록 ({filteredSpecies.length}종류)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filteredSpecies.map((sp) => {
                  const isSelected = sp.id === selectedSpecies.id;
                  const baseStage = sp.evolutionStages[0];

                  return (
                    <button
                      key={sp.id}
                      onClick={() => handleSpeciesChange(sp)}
                      className={`p-2 rounded-2xl border transition-all text-center flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/90 shadow-xs ring-2 ring-amber-300'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={baseStage.animatedSprite || baseStage.sprite}
                        alt={baseStage.name}
                        style={{ imageRendering: 'pixelated' }}
                        className="w-13 h-13 object-contain drop-shadow-xs pixelated"
                      />
                      <span className="font-extrabold text-xs text-slate-800">{baseStage.name}</span>
                      <span className="text-[9px] text-slate-400">
                        No.{baseStage.pokedexNo}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Pokemon Evolution Line Preview */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 rounded-2xl border border-amber-200">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              🌿 {selectedSpecies.name} 진화 정보
            </span>
            <div className="flex items-center justify-around">
              {selectedSpecies.evolutionStages.map((stg) => (
                <div key={stg.id} className="text-center flex flex-col items-center">
                  <div className="w-13 h-13 rounded-full bg-white border border-amber-200 flex items-center justify-center shadow-2xs mb-1">
                    <img
                      src={stg.animatedSprite || stg.sprite}
                      alt={stg.name}
                      style={{ imageRendering: 'pixelated' }}
                      className="w-11 h-11 object-contain pixelated"
                    />
                  </div>
                  <span className="font-bold text-[11px] text-slate-800">{stg.name}</span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    {stg.stepsRequired === 0
                      ? '기본'
                      : `${stg.stepsRequired.toLocaleString()}보`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              포켓몬 닉네임 설정
            </label>
            <input
              type="text"
              maxLength={12}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="포켓몬 이름을 지어주세요"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden"
            />
          </div>

          {/* Personality Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              성격 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONALITIES.map((pers) => {
                const isSelected = personality === pers.key;
                return (
                  <button
                    key={pers.key}
                    onClick={() => {
                      soundManager.playClick();
                      setPersonality(pers.key);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <span>{pers.badge}</span>
                      <span>{pers.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{pers.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Confirm */}
        <div className="pt-3 border-t border-slate-200 mt-2">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Check size={18} />
            <span>이 포켓몬과 함께 걷기!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
