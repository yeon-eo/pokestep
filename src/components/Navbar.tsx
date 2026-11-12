import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, RefreshCw, Wrench, Users } from 'lucide-react';
import { PartnerPokemon } from '../types/pokemon';
import { soundManager } from '../utils/audio';
import { isOwnerDevice, setOwnerDevice } from '../utils/storage';

interface NavbarProps {
  partner: PartnerPokemon | null;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAdmin: () => void;
  onOpenPartnerSelect: () => void;
  onOpenFriends: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  partner,
  isSoundEnabled,
  onToggleSound,
  onOpenAdmin,
  onOpenPartnerSelect,
  onOpenFriends,
}) => {
  const [tapCount, setTapCount] = useState<number>(0);
  const [isOwner, setIsOwner] = useState<boolean>(() => isOwnerDevice());

  // Check URL params on load
  useEffect(() => {
    if (isOwnerDevice()) {
      setIsOwner(true);
    }
  }, []);

  // Secret 7-tap easter egg (silent, no public hint banner)
  const handleTitleTap = () => {
    soundManager.playClick();
    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if (nextCount >= 7) {
      setTapCount(0);
      setOwnerDevice(true);
      setIsOwner(true);
      onOpenAdmin();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Title / Secret Easter Egg tap zone */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTitleTap}
            className="group flex items-center gap-2 text-left focus:outline-hidden select-none active:scale-95 transition-transform"
            title="포케스텝 - 포켓몬과 함께 걷는 산책친구"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-500 via-rose-500 to-amber-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1/2 bg-red-500"></div>
                <div className="absolute top-1/2 w-full h-[2px] bg-slate-800 -translate-y-1/2"></div>
                <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-800 z-10 shadow-xs"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-800 tracking-tight flex items-center gap-1 font-['Gaegu'] text-2xl">
                  포케스텝
                  <span className="text-xs font-sans px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    PokeStep
                  </span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 font-medium">포켓몬과 함께 걷는 산책친구</p>
            </div>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              isSoundEnabled
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
            }`}
            title={isSoundEnabled ? '사운드 켜짐' : '사운드 꺼짐'}
          >
            {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Friends Leaderboard */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenFriends();
            }}
            className="p-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors flex items-center gap-1"
            title="친구 산책 현황 & 친구 코드"
          >
            <Users size={16} />
          </button>

          {/* Change Partner */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenPartnerSelect();
            }}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="파트너 포켓몬 검색 & 교체"
          >
            <RefreshCw size={16} />
          </button>

          {/* OPERATOR BUTTON: ONLY VISIBLE TO THE OWNER! (COMPLETELY HIDDEN FOR REGULAR VISITORS) */}
          {isOwner && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenAdmin();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs shadow-2xs transition-all active:scale-95 animate-fade-in"
              title="운영자 관리 모드 (오직 관리자 기기에서만 노출됩니다)"
            >
              <Wrench size={13} className="text-red-500" />
              <span>운영자</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
