import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { EvolutionStage, PartnerPokemon, PokemonSpecies } from '../types/pokemon';
import { soundManager } from '../utils/audio';
import { Sparkles, X, ShieldAlert, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface EvolutionModalProps {
  species: PokemonSpecies;
  currentStage: EvolutionStage;
  targetStage: EvolutionStage;
  partner: PartnerPokemon;
  onCompleteEvolution: () => void;
  onCancelEvolution: (equipEverstone: boolean) => void;
}

export const EvolutionModal: React.FC<EvolutionModalProps> = ({
  species,
  currentStage,
  targetStage,
  partner,
  onCompleteEvolution,
  onCancelEvolution,
}) => {
  const [phase, setPhase] = useState<'anticipation' | 'cancelled' | 'success'>('anticipation');
  const [timeLeft, setTimeLeft] = useState<number>(5);
  const [flash, setFlash] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Anticipation countdown & audio pulse
  useEffect(() => {
    if (phase !== 'anticipation') return;

    // Flash animation loop
    flashTimerRef.current = setInterval(() => {
      setFlash((prev) => !prev);
    }, 400);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (flashTimerRef.current) clearInterval(flashTimerRef.current);
          handleEvolutionSucceed();
          return 0;
        }
        // Play evolution anticipation pulse
        soundManager.playEvolutionPulse(1.0 + (5 - prev) * 0.15);
        return prev - 1;
      });
    }, 1000);

    soundManager.playEvolutionPulse(1.0);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);
    };
  }, [phase]);

  // When B button is pressed to STOP evolution!
  const handleStopEvolution = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (flashTimerRef.current) clearInterval(flashTimerRef.current);
    soundManager.playCancelEvolution();
    setPhase('cancelled');
  };

  // When evolution naturally completes!
  const handleEvolutionSucceed = () => {
    setPhase('success');
    soundManager.playEvolutionSuccess();
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'],
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-6 border-2 border-amber-400/40 shadow-2xl overflow-hidden text-white text-center">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Phase 1: Anticipation with B Button to Cancel */}
        {phase === 'anticipation' && (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold animate-pulse">
              <Sparkles size={14} />
              <span>진화 진행 중… ({timeLeft}초)</span>
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white font-['Gaegu'] text-3xl">
                어라...? {partner.nickname}의 상태가...?!
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                충분히 걸어서 몸에서 찬란한 진화의 빛이 뿜어져 나옵니다!
              </p>
            </div>

            {/* Pulsating Morphing Sprite Showcase */}
            <div className="relative h-48 flex items-center justify-center">
              {/* Radial aura rings */}
              <div
                className={`absolute w-44 h-44 rounded-full transition-all duration-300 ${
                  flash
                    ? 'bg-amber-300/30 scale-125 blur-xl'
                    : 'bg-white/10 scale-95 blur-md'
                }`}
              />

              {/* Current Pokemon or Silhouetted Next Stage */}
              <img
                src={flash ? targetStage.animatedSprite || targetStage.sprite : currentStage.animatedSprite || currentStage.sprite}
                alt={partner.nickname}
                style={{ imageRendering: 'pixelated' }}
                className={`relative z-10 w-32 h-32 object-contain drop-shadow-2xl transition-all duration-200 pixelated ${
                  flash ? 'brightness-200 contrast-125 scale-110' : 'brightness-100 scale-100'
                }`}
              />
            </div>

            {/* Evolution path indicator */}
            <div className="flex items-center justify-center gap-3 text-sm font-bold bg-slate-800/80 py-2 px-4 rounded-2xl border border-slate-700">
              <span className="text-amber-300">{currentStage.name}</span>
              <ArrowRight size={16} className="text-slate-400 animate-pulse" />
              <span className="text-emerald-400 font-extrabold">{targetStage.name}</span>
            </div>

            {/* Prominent B-Button to Stop Evolution (as requested!) */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleStopEvolution}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-base tracking-wide shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-red-300/40 animate-pulse"
              >
                <div className="w-8 h-8 rounded-full bg-red-900 border-2 border-white flex items-center justify-center font-black text-sm shadow-inner">
                  B
                </div>
                <span>B 버튼 연타 : 진화 멈추기!</span>
              </button>
              <p className="text-[11px] text-slate-400">
                💡 지금 B 버튼을 누르면 진화를 취소하고 원래 모습을 그대로 간직할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Phase 2: Cancelled (Evolution Stopped!) */}
        {phase === 'cancelled' && (
          <div className="space-y-6 py-4 animate-scale-up">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300">
              <ShieldCheck size={36} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-amber-300 font-['Gaegu'] text-3xl">
                어랏...?! 진화를 멈췄습니다!
              </h2>
              <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                <span className="font-bold text-white">{partner.nickname}</span>(은)는 안도한 듯
                방긋 웃으며 원래 귀여운 모습 그대로 함께 걷습니다!
              </p>
            </div>

            <div className="py-2">
              <img
                src={currentStage.animatedSprite || currentStage.sprite}
                alt={currentStage.name}
                style={{ imageRendering: 'pixelated' }}
                className="w-28 h-28 mx-auto object-contain drop-shadow-lg pixelated"
              />
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <ShieldAlert size={16} className="text-amber-400 shrink-0" />
                <span>앞으로도 진화를 막고 싶으신가요?</span>
              </div>
              <p className="text-slate-400 leading-normal">
                '변함없는돌'을 착용하면 걸음수를 채워도 진화 이벤트가 발생하지 않고 현재의 귀여운 모습을 계속 유지할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => onCancelEvolution(true)}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                <span>변함없는돌 장착하고 닫기 (진화 영구 방지)</span>
              </button>
              <button
                onClick={() => onCancelEvolution(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs transition-colors"
              >
                그냥 닫기 (다음에 다시 진화 가능)
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Success! Evolved! */}
        {phase === 'success' && (
          <div className="space-y-6 py-2 animate-scale-up">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
              <Sparkles size={14} />
              <span>진화 성공! LEVEL UP!</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-amber-300 font-['Gaegu'] text-3xl">
                축하합니다! 진화했습니다!
              </h2>
              <p className="text-sm text-slate-200 mt-1">
                <span className="font-bold text-white">{partner.nickname}</span>(은)는{' '}
                <span className="font-extrabold text-emerald-300 text-base">{targetStage.name}</span>(으)로
                진화했습니다!
              </p>
            </div>

            {/* New Stage Sprite */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 bg-amber-400/20 rounded-full blur-2xl"></div>
              </div>
              <img
                src={targetStage.animatedSprite || targetStage.sprite}
                alt={targetStage.name}
                style={{ imageRendering: 'pixelated' }}
                className="relative z-10 w-32 h-32 mx-auto object-contain drop-shadow-2xl animate-bounce pixelated"
              />
            </div>

            {/* New Pokemon Stats Card */}
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 text-left space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400">도감 No.{targetStage.pokedexNo}</span>
                  <h4 className="font-black text-lg text-white">{targetStage.name}</h4>
                </div>
                <div className="flex gap-1">
                  {targetStage.types.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-700/60 pt-2">
                {targetStage.description}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
                <div>키: <span className="text-white font-medium">{targetStage.height}</span></div>
                <div>몸무게: <span className="text-white font-medium">{targetStage.weight}</span></div>
              </div>
            </div>

            <button
              onClick={onCompleteEvolution}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>멋진 모습으로 산책 계속하기!</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
