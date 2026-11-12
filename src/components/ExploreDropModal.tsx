import React from 'react';
import { GameItem } from '../types/pokemon';
import { soundManager } from '../utils/audio';
import { Sparkles, Check } from 'lucide-react';

interface ExploreDropModalProps {
  item: GameItem;
  count: number;
  partnerName: string;
  onClose: () => void;
}

export const ExploreDropModal: React.FC<ExploreDropModalProps> = ({
  item,
  count,
  partnerName,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-amber-200 text-center animate-scale-up">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
          <Sparkles size={14} className="text-amber-500" />
          <span>산책 중 아이템 발견!</span>
        </div>

        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-4xl shadow-md my-3 animate-bounce">
          {item.emoji}
        </div>

        <h3 className="text-xl font-black text-slate-800 font-['Gaegu'] text-2xl">
          {item.name} x{count}개 획득!
        </h3>

        <p className="text-xs text-slate-500 mt-2 px-2 leading-relaxed">
          <strong className="text-slate-700">{partnerName}</strong>(이)가 산책길 풀숲에서
          소중한 아이템을 물어왔습니다!
        </p>

        <div className="mt-5">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Check size={16} />
            <span>가방에 넣기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
