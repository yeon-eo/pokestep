import React, { useState } from 'react';
import { AdminConfig, PartnerPokemon, GameItem } from '../types/pokemon';
import { POKEMON_SPECIES_LIST } from '../data/pokemonData';
import { GAME_ITEMS } from '../data/itemsData';
import { verifyAdminPin, resetAdminPin, saveAdminConfig, isOwnerDevice, setOwnerDevice } from '../utils/storage';
import { soundManager } from '../utils/audio';
import {
  Wrench,
  KeyRound,
  Footprints,
  Sparkles,
  Zap,
  Package,
  Heart,
  Check,
  X,
  AlertTriangle,
  Info,
  Shield,
  RotateCcw,
  Palette,
  Image,
  Save,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminModalProps {
  adminConfig: AdminConfig;
  partner: PartnerPokemon | null;
  customItems: Record<string, Partial<GameItem>>;
  onUpdateAdminConfig: (newConfig: AdminConfig) => void;
  onUpdateCustomItem: (itemId: string, updated: Partial<GameItem>) => void;
  onResetCustomItems: () => void;
  onAddSteps: (steps: number) => void;
  onForceEvolve: () => void;
  onRollbackEvolution: () => void;
  onToggleEverstone: () => void;
  onFillInventory: () => void;
  onMaxFriendshipHunger: () => void;
  onResetAllData: () => void;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  adminConfig,
  partner,
  customItems,
  onUpdateAdminConfig,
  onUpdateCustomItem,
  onResetCustomItems,
  onAddSteps,
  onForceEvolve,
  onRollbackEvolution,
  onToggleEverstone,
  onFillInventory,
  onMaxFriendshipHunger,
  onResetAllData,
  onClose,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPin, setInputPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [customSteps, setCustomSteps] = useState<string>('5000');
  const [newPin, setNewPin] = useState<string>('');
  const [showAdminButtonOnThisDevice, setShowAdminButtonOnThisDevice] = useState<boolean>(() => isOwnerDevice());

  // Item customizer state
  const [selectedItemId, setSelectedItemId] = useState<string>('poffin-spicy');
  const [customName, setCustomName] = useState<string>('');
  const [customEmoji, setCustomEmoji] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [customDesc, setCustomDesc] = useState<string>('');
  const [customMultiplier, setCustomMultiplier] = useState<number>(1.5);
  const [customFriendship, setCustomFriendship] = useState<number>(25);

  const showToast = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const activeBaseItem = GAME_ITEMS[selectedItemId];

  const handleSelectItemToEdit = (id: string) => {
    setSelectedItemId(id);
    const base = GAME_ITEMS[id];
    const custom = customItems[id] || {};
    setCustomName(custom.name || base?.name || '');
    setCustomEmoji(custom.emoji || base?.emoji || '');
    setCustomImageUrl(custom.iconUrl || base?.iconUrl || '');
    setCustomDesc(custom.desc || base?.desc || '');
    setCustomMultiplier(custom.stepMultiplierBonus?.multiplier || base?.stepMultiplierBonus?.multiplier || 1.5);
    setCustomFriendship(custom.friendshipBonus || base?.friendshipBonus || 25);
  };

  // PIN Verification
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundManager.playClick();

    if (verifyAdminPin(inputPin)) {
      setIsAuthenticated(true);
      setOwnerDevice(true);
      setShowAdminButtonOnThisDevice(true);
      setErrorMessage(null);
      handleSelectItemToEdit('poffin-spicy');
      showToast('운영자 인증에 성공했습니다! (관리자 기기로 등록됨)');
    } else {
      setErrorMessage('PIN 번호가 일치하지 않습니다.');
    }
  };

  // Change PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setErrorMessage('새 PIN은 4자리 이상 입력해주세요.');
      return;
    }
    const updated = { ...adminConfig, adminPin: newPin.trim() };
    saveAdminConfig(updated);
    onUpdateAdminConfig(updated);
    setNewPin('');
    showToast(`비밀번호가 성공적으로 변경되었습니다.`);
  };

  // Save Item Customization
  const handleSaveItemCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playFeed();

    const updated: Partial<GameItem> = {
      name: customName.trim() || activeBaseItem.name,
      emoji: customEmoji.trim() || activeBaseItem.emoji,
      iconUrl: customImageUrl.trim() || undefined,
      desc: customDesc.trim() || activeBaseItem.desc,
      friendshipBonus: customFriendship,
      stepMultiplierBonus: {
        multiplier: customMultiplier,
        durationMinutes: 15,
      },
    };

    onUpdateCustomItem(selectedItemId, updated);
    showToast(`[ ${updated.name} ] 이미지 및 설정이 저장되었습니다!`);
  };

  // Toggle Visibility on this device
  const handleToggleDeviceVisibility = () => {
    const nextVal = !showAdminButtonOnThisDevice;
    setShowAdminButtonOnThisDevice(nextVal);
    setOwnerDevice(nextVal);
    showToast(
      nextVal
        ? '내 기기에서 상단 [운영자] 버튼이 항상 표시됩니다.'
        : '일반 방문자 모드로 전환되었습니다. (운영자 버튼 숨김)'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-red-200 flex flex-col max-h-[92vh] overflow-hidden text-slate-800">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
          <div className="p-2 rounded-xl bg-red-100 text-red-600">
            <Lock size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800 font-['Gaegu'] text-2xl">
                운영자 비밀 관리 모드
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-extrabold uppercase">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-slate-500">
              일반 방문자에게는 노출되지 않는 관리자 전용 제어 콘솔
            </p>
          </div>
        </div>

        {/* Success Toast */}
        {successNotice && (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check size={16} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* LOGIN SCREEN */}
        {!isAuthenticated ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Shield size={16} className="text-red-500 shrink-0" />
                <span>관리자 전용 보안 안내</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                운영자 모드는 **일반 방문자에게 완전히 숨겨져 있으며**, 오직 관리자님만 접속할 수 있습니다.
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-1 text-[11px]">
                <div>• 로그인 후 원하는 비밀번호로 변경할 수 있습니다.</div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  운영자 PIN 비밀번호
                </label>
                <div className="relative">
                  <KeyRound
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    maxLength={10}
                    value={inputPin}
                    onChange={(e) => {
                      setInputPin(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="PIN 입력"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-center text-lg font-mono tracking-widest outline-hidden"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                  <AlertTriangle size={15} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-md transition-all active:scale-95"
              >
                관리자 인증하기
              </button>
            </form>
          </div>
        ) : (
          /* UNLOCKED ADMIN CONSOLE */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            {/* 1. VISIBILITY STATUS & PRIVACY CARD */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                  <Shield size={15} />
                  <span>운영자 버튼 노출 설정 (보안)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {showAdminButtonOnThisDevice ? '내 기기 노출 중' : '모두 숨김'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                현재 접속하신 이 기기는 관리자 기기로 등록되었습니다.
                **다른 일반 사용자의 화면에는 상단 [운영자] 버튼이 전혀 보이지 않습니다.**
              </p>
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleDeviceVisibility}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  {showAdminButtonOnThisDevice ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>
                    {showAdminButtonOnThisDevice
                      ? '일반 방문자 시점으로 보기 (버튼 숨김)'
                      : '내 기기에서 버튼 보이기'}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. POFFIN & ITEM IMAGE/SETTING CUSTOMIZER */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-300 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                  <Palette size={16} className="text-amber-600" />
                  <span>포핀 & 간식 이미지 및 스펙 변경</span>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  편집할 포핀/아이템 선택
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(GAME_ITEMS)
                    .filter((i) => i.category === 'poffin' || i.category === 'berry')
                    .map((item) => {
                      const isSel = item.id === selectedItemId;
                      const custom = customItems[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItemToEdit(item.id)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isSel
                              ? 'border-amber-500 bg-white ring-2 ring-amber-300 shadow-xs'
                              : 'border-amber-200/80 bg-white/70 hover:bg-white'
                          }`}
                        >
                          <span className="text-lg">{custom?.emoji || item.emoji}</span>
                          <span className="font-bold text-[10px] text-slate-800 truncate">
                            {custom?.name || item.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              <form onSubmit={handleSaveItemCustomization} className="space-y-2 bg-white/90 p-3 rounded-xl border border-amber-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      아이템 이름
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      이모지 (아이콘)
                    </label>
                    <input
                      type="text"
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
                    <Image size={12} className="text-amber-600" />
                    <span>커스텀 이미지 URL (선택)</span>
                  </label>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://... 이미지 주소 입력 시 이모지 대신 표시"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    아이템 설명
                  </label>
                  <input
                    type="text"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      걸음수 부스트 배율
                    </label>
                    <select
                      value={customMultiplier}
                      onChange={(e) => setCustomMultiplier(parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      <option value={1.5}>1.5배 (기본)</option>
                      <option value={2.0}>2.0배 (2배속)</option>
                      <option value={3.0}>3.0배 (3배속)</option>
                      <option value={5.0}>5.0배 (초고속)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      친밀도 증가량
                    </label>
                    <input
                      type="number"
                      value={customFriendship}
                      onChange={(e) => setCustomFriendship(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>이 포핀 설정 저장하기</span>
                </button>
              </form>
            </div>

            {/* 3. STEP INJECTOR */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Footprints size={16} className="text-blue-500" />
                <span>걸음수 즉시 주입 (만보기 테스트)</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[1000, 3000, 5000, 10000].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      soundManager.playStep();
                      onAddSteps(st);
                      showToast(`+${st.toLocaleString()}보 주입 완료!`);
                    }}
                    className="py-2 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs transition-colors"
                  >
                    +{st >= 1000 ? `${st / 1000}천` : st}보
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="number"
                  value={customSteps}
                  onChange={(e) => setCustomSteps(e.target.value)}
                  placeholder="직접 걸음수 입력"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
                <button
                  onClick={() => {
                    const parsed = parseInt(customSteps, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      soundManager.playStep();
                      onAddSteps(parsed);
                      showToast(`+${parsed.toLocaleString()}보 주입 완료!`);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  지급
                </button>
              </div>
            </div>

            {/* 4. EVOLUTION CONTROL */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                <span>진화 시스템 제어</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onForceEvolve();
                    showToast('진화 이벤트가 시작됩니다!');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center gap-1.5 border border-amber-200"
                >
                  <Sparkles size={15} />
                  <span>즉시 강제 진화</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onRollbackEvolution();
                    showToast('1단계 아기 포켓몬으로 롤백되었습니다.');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={15} />
                  <span>1단계로 롤백</span>
                </button>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onToggleEverstone();
                  showToast(
                    partner?.isEverstoneEquipped
                      ? '변함없는돌이 해제되었습니다.'
                      : '변함없는돌이 장착되었습니다. (진화 방지)'
                  );
                }}
                className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                  partner?.isEverstoneEquipped
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Shield size={15} />
                <span>
                  {partner?.isEverstoneEquipped
                    ? '변함없는돌 착용 중 (클릭 시 탈착)'
                    : '변함없는돌 장착하기 (진화 방지)'}
                </span>
              </button>
            </div>

            {/* 5. ITEM CHEAT */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Package size={16} className="text-purple-500" />
                <span>인벤토리 즉시 충전</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundManager.playFeed();
                    onFillInventory();
                    showToast('모든 포핀 & 열매가 99개씩 지급되었습니다!');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold border border-purple-200 flex items-center justify-center gap-1.5"
                >
                  <Zap size={15} />
                  <span>모든 아이템 99개 충전</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playFeed();
                    onMaxFriendshipHunger();
                    showToast('친밀도 및 배부름이 100%가 되었습니다!');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold border border-rose-200 flex items-center justify-center gap-1.5"
                >
                  <Heart size={15} />
                  <span>친밀도/배부름 100%</span>
                </button>
              </div>
            </div>

            {/* 6. CHANGE PIN */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound size={15} className="text-slate-500" />
                <span>관리자 비밀번호(PIN) 변경</span>
              </span>
              <form onSubmit={handleChangePin} className="flex gap-2">
                <input
                  type="password"
                  maxLength={10}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  변경
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
