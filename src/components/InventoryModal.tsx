import React from 'react';
import { GameItem, PartnerPokemon } from '../types/pokemon';
import { GAME_ITEMS } from '../data/itemsData';
import { soundManager } from '../utils/audio';
import { X, Shield, ShieldCheck, ShieldAlert, Sparkles, Package, Zap } from 'lucide-react';

interface InventoryModalProps {
  partner: PartnerPokemon | null;
  inventory: Record<string, number>;
  onToggleEverstone: () => void;
  onUseRareCandy: () => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  partner,
  inventory,
  onToggleEverstone,
  onUseRareCandy,
  onClose,
}) => {
  const isEverstoneEquipped = partner?.isEverstoneEquipped || false;
  const rareCandyCount = inventory['candy-rare'] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
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

        {/* Modal Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
            <Package size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 font-['Gaegu'] text-2xl">
              트레이너 가방 & 도구함
            </h3>
            <p className="text-xs text-slate-500">
              산책하며 모은 열매, 포핀, 그리고 특별한 진화 도구들
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* SPECIAL CARD: EVERSTONE (변함없는돌 - 진화 멈추기 기능) */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-200/60 border border-amber-300 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  🪨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">변함없는돌 (Everstone)</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isEverstoneEquipped
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isEverstoneEquipped ? '🛡️ 장착 중 (진화 방지)' : '미장착'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    포켓몬에게 쥐여주면 목표 걸음수를 달성해도 <strong className="text-slate-800">진화하지 않고</strong> 현재 귀여운 모습을 계속 유지합니다!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-200/80">
              <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                {isEverstoneEquipped ? (
                  <>
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>진화 방지 보호 중</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} className="text-amber-600" />
                    <span>걸음수 달성 시 진화 가능</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onToggleEverstone();
                }}
                className={`py-1.5 px-3.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 ${
                  isEverstoneEquipped
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                }`}
              >
                {isEverstoneEquipped ? '돌 해제하기' : '파트너에게 장착'}
              </button>
            </div>
          </div>

          {/* RARE CANDY SPECIAL ACTION */}
          {rareCandyCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🍬</span>
                <div>
                  <div className="font-extrabold text-sm text-slate-800">이상한사탕 (Rare Candy)</div>
                  <div className="text-xs text-slate-500">
                    보유: <span className="font-bold text-blue-600">{rareCandyCount}개</span> | 먹이면 진화 걸음수 +2,000보 즉시 증가!
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.playFeed();
                  onUseRareCandy();
                }}
                className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                사탕 먹이기
              </button>
            </div>
          )}

          {/* ALL ITEMS IN INVENTORY */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 block mb-1">
              🎒 보유 중인 아이템 목록
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.values(GAME_ITEMS).map((item) => {
                const count = inventory[item.id] || 0;
                if (count <= 0) return null;

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-2.5"
                  >
                    <span className="text-2xl shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 truncate">{item.name}</span>
                        <span className="text-xs font-black text-amber-600 ml-1">x{count}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 mt-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
