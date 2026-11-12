import React, { useState, useEffect, useRef } from 'react';
import { EvolutionStage, PartnerPokemon, PokemonSpecies, DailyStepRecord } from '../types/pokemon';
import { POKEMON_VOICE_LINES, getPmdPortraitUrl } from '../data/pokemonData';
import { soundManager } from '../utils/audio';
import { MotionPedometer } from '../utils/motionPedometer';
import {
  Footprints,
  Flame,
  MapPin,
  Sparkles,
  Heart,
  Utensils,
  Package,
  ShieldCheck,
  TrendingUp,
  Award,
  RefreshCw,
  Users,
  Smartphone,
  Activity,
  Timer,
  Navigation,
} from 'lucide-react';

interface WalkingScreenProps {
  partner: PartnerPokemon;
  species: PokemonSpecies;
  currentStage: EvolutionStage;
  nextStage: EvolutionStage | null;
  todayRecord: DailyStepRecord;
  totalSteps: number;
  dailyGoal?: number;
  onAddSteps: (steps: number) => void;
  onTriggerEvolution: () => void;
  onOpenFeeding: () => void;
  onOpenInventory: () => void;
  onOpenPartnerSelect: () => void;
  onOpenFriends: () => void;
  onOpenAdmin: () => void;
}

export const WalkingScreen: React.FC<WalkingScreenProps> = ({
  partner,
  species,
  currentStage,
  nextStage,
  todayRecord,
  totalSteps,
  dailyGoal = 10000,
  onAddSteps,
  onTriggerEvolution,
  onOpenFeeding,
  onOpenInventory,
  onOpenPartnerSelect,
  onOpenFriends,
  onOpenAdmin,
}) => {
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(true);
  const [motionIntensity, setMotionIntensity] = useState<number>(0);
  const [activeSessionSeconds, setActiveSessionSeconds] = useState<number>(0);
  const [sessionSteps, setSessionSteps] = useState<number>(0);
  const [speechText, setSpeechText] = useState<string>('함께 걸을 준비가 되었어요!');
  const [speechBubbleVisible, setSpeechBubbleVisible] = useState<boolean>(true);
  const [currentEmotion, setCurrentEmotion] = useState<'Normal' | 'Happy' | 'Joyous'>('Normal');
  const [sensorNotice, setSensorNotice] = useState<string | null>(null);

  // Motion Pedometer Instance ref
  const pedometerRef = useRef<MotionPedometer | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Steps remaining for evolution
  const stepsForNext = nextStage ? nextStage.stepsRequired : 0;
  const currentPartnerSteps = partner.totalStepsWalked;
  const stepsRemaining = Math.max(0, stepsForNext - currentPartnerSteps);
  const kmRemaining = +(stepsRemaining * 0.00075).toFixed(1);
  const canEvolveNow = nextStage && stepsRemaining === 0;

  // Evolution progress percentage
  const prevRequired = currentStage.stepsRequired;
  const progressRatio = nextStage
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((currentPartnerSteps - prevRequired) /
              Math.max(1, stepsForNext - prevRequired)) *
              100
          )
        )
      )
    : 100;

  // Active walking session timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTrackingActive) {
      timer = setInterval(() => {
        setActiveSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTrackingActive]);

  // WakeLock: Keep screen on during active walk
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isTrackingActive) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch {}
      }
    };
    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [isTrackingActive]);

  // Real Motion & GPS Pedometer (NO BUTTON ARTIFICIAL STEPS)
  useEffect(() => {
    const pedometer = new MotionPedometer(() => {
      // Step callback triggered ONLY by real physical motion or GPS displacement!
      soundManager.playStep();
      onAddSteps(1);
      setSessionSteps((prev) => prev + 1);
      setCurrentEmotion('Happy');
      setTimeout(() => setCurrentEmotion('Normal'), 1500);
    });
    pedometerRef.current = pedometer;

    if (isTrackingActive) {
      pedometer.start();
    }

    const gaugeInterval = setInterval(() => {
      if (pedometerRef.current) {
        setMotionIntensity(pedometerRef.current.getMotionIntensity());
      }
    }, 150);

    return () => {
      clearInterval(gaugeInterval);
      if (pedometerRef.current) {
        pedometerRef.current.stop();
      }
    };
  }, [isTrackingActive, onAddSteps]);

  // Request iOS permission if needed
  const handleRequestMotionPermission = async () => {
    if (pedometerRef.current) {
      const granted = await pedometerRef.current.requestPermission();
      if (granted) {
        pedometerRef.current.start();
        setIsTrackingActive(true);
        setSensorNotice('실시간 걷기 모션 센서가 활성화되었습니다!');
      } else {
        setSensorNotice('센서 권한이 거부되었습니다.');
      }
      setTimeout(() => setSensorNotice(null), 3000);
    }
  };

  // Random speech update when walking
  useEffect(() => {
    const voiceData = POKEMON_VOICE_LINES[partner.personality] || POKEMON_VOICE_LINES.warm;
    const linePool = motionIntensity > 20 ? voiceData.walking : voiceData.base;
    const randomLine = linePool[Math.floor(Math.random() * linePool.length)];
    setSpeechText(randomLine);
  }, [partner.speciesId, motionIntensity]);

  // Tap Pokemon to play voice & animation
  const handleTapPokemon = () => {
    soundManager.playFeed();
    setCurrentEmotion('Joyous');
    setTimeout(() => setCurrentEmotion('Normal'), 2000);
    const voiceData = POKEMON_VOICE_LINES[partner.personality] || POKEMON_VOICE_LINES.warm;
    const pool = [...voiceData.base, ...voiceData.walking];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setSpeechText(picked);
    setSpeechBubbleVisible(true);
  };

  const goalPercent = Math.min(100, Math.round((todayRecord.steps / dailyGoal) * 100));

  // Format session time (MM:SS or HH:MM:SS)
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}시간 ${m}분 ${s}초`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // PMD SpriteCollab pixel portrait URL with current emotion
  const pmdPortraitUrl = getPmdPortraitUrl(currentStage.pokedexNo, currentEmotion);

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-3 pb-24">
      {/* 1. TOP COMPANION CARD: PMD SpriteCollab (CC BY-NC 4.0) DOT ART */}
      <div className="relative rounded-3xl bg-gradient-to-b from-white to-amber-50/70 p-5 border border-amber-200/80 shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/30 via-yellow-100/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {partner.personality === 'warm'
                ? '💛 다정함'
                : partner.personality === 'lively'
                ? '⚡ 활발함'
                : partner.personality === 'calm'
                ? '🍃 느긋함'
                : partner.personality === 'shy'
                ? '🎀 새침함'
                : partner.personality === 'brave'
                ? '🔥 용감함'
                : '✨ 장난꾸러기'}
            </span>
            {currentStage.types.map((t) => (
              <span
                key={t}
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Everstone Indicator */}
          {partner.isEverstoneEquipped ? (
            <button
              onClick={onOpenInventory}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs hover:bg-rose-200 transition-colors"
              title="변함없는돌 착용 중 - 진화 방지 활성화됨 (클릭하여 도구함 이동)"
            >
              <ShieldCheck size={13} />
              <span>변함없는돌 착용 중</span>
            </button>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">
              {currentStage.stage}단계 포켓몬
            </span>
          )}
        </div>

        {/* SPEECH BUBBLE WITH PMD EMOTION FACE (CLEAN SEPARATION - NEVER COVERS POKEMON) */}
        {speechBubbleVisible && (
          <div className="mb-3 px-3.5 py-2.5 rounded-2xl bg-white/95 border border-amber-200 shadow-md flex items-center justify-between gap-2.5 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <img
                  src={pmdPortraitUrl}
                  alt={partner.nickname}
                  style={{ imageRendering: 'pixelated' }}
                  className="w-9 h-9 object-contain pixelated"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-700 block">
                  {partner.nickname}의 한마디
                </span>
                <p className="font-['Gaegu'] text-base sm:text-lg font-bold text-slate-800 leading-tight">
                  "{speechText}"
                </p>
              </div>
            </div>
            <button
              onClick={() => setSpeechBubbleVisible(false)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1 shrink-0"
              title="말풍선 접기"
            >
              ✕
            </button>
          </div>
        )}

        {/* FULL-BODY ANIMATED POKEMON SPRITE (움직이는 전신 스프라이트) */}
        <div className="flex flex-col items-center justify-center py-2">
          {/* Animated Pokemon Container */}
          <button
            onClick={handleTapPokemon}
            className={`relative p-2 flex items-center justify-center focus:outline-hidden transition-all duration-300 cursor-pointer ${
              motionIntensity > 20 ? 'scale-110 -translate-y-2' : 'hover:scale-105 active:scale-95'
            }`}
            title="포켓몬을 터치하면 즐거워합니다!"
          >
            {/* Full-Body Animated Sprite */}
            <img
              src={currentStage.animatedSprite || currentStage.sprite}
              alt={partner.nickname}
              style={{ imageRendering: 'pixelated' }}
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-xl pixelated transition-transform duration-200"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== currentStage.sprite) {
                  target.src = currentStage.sprite;
                }
              }}
            />
            {currentEmotion !== 'Normal' && (
              <span className="absolute top-0 right-2 text-2xl animate-bounce">
                💖
              </span>
            )}
          </button>

          {/* Ground Contact Shadow */}
          <div className="w-28 sm:w-36 h-3 rounded-full bg-slate-700/15 blur-xs mt-1" />

          {/* Nickname & Category */}
          <div className="mt-2 text-center">
            <h2 className="text-2xl font-black text-slate-900 font-['Gaegu'] text-3xl">
              {partner.nickname}
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500">
                도감 No.{currentStage.pokedexNo} • {currentStage.category}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                전신 움직이는 도트
              </span>
            </div>
          </div>

          {/* Hunger & Friendship Status Pills */}
          <div className="flex items-center gap-3 mt-2.5 text-xs font-bold text-slate-600">
            <button
              onClick={onOpenFeeding}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 transition-colors"
            >
              <Utensils size={13} className="text-amber-600" />
              <span>배부름 {partner.hunger}%</span>
            </button>
            <button
              onClick={onOpenFeeding}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors"
            >
              <Heart size={13} className="fill-rose-500 text-rose-500" />
              <span>친밀도 {partner.friendship}/100</span>
            </button>
          </div>
        </div>

        {/* SUBSTANTIALLY INCREASED EVOLUTION PROGRESSION */}
        <div className="mt-4 pt-3 border-t border-amber-200/60">
          {nextStage ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1 text-slate-700">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>진화 경로: {currentStage.name} ➔ {nextStage.name}</span>
                </span>
                <span className="text-amber-700 font-black">
                  {canEvolveNow
                    ? '진화 준비 완료!'
                    : `남은 걸음: ${stepsRemaining.toLocaleString()}보 (약 ${kmRemaining}km)`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressRatio}%` }}
                />
              </div>

              {canEvolveNow ? (
                partner.isEverstoneEquipped ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs">
                    <span className="text-amber-800 font-medium">
                      🛡️ 변함없는돌로 인해 진화가 보류 중입니다.
                    </span>
                    <button
                      onClick={onOpenInventory}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-900 font-extrabold hover:bg-amber-400 transition-colors"
                    >
                      돌 해제하기
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      soundManager.playLevelUp();
                      onTriggerEvolution();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 animate-pulse"
                  >
                    <Sparkles size={18} />
                    <span>지금 바로 {nextStage.name}(으)로 진화하기!</span>
                  </button>
                )
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>누적: {currentPartnerSteps.toLocaleString()}보 (약 {(currentPartnerSteps * 0.00075).toFixed(1)}km)</span>
                  <span>진화 목표: {stepsForNext.toLocaleString()}보 (약 {(stepsForNext * 0.00075).toFixed(1)}km)</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
              <Award size={16} />
              <span>최종 단계에 도달한 자랑스러운 파트너입니다!</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. REAL PHYSICAL PEDOMETER & WALKING TRACKER (ZERO BUTTON CHEATS) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Sensor Live Status Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-600 relative"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-xs text-emerald-950">
                <Activity size={14} className="text-emerald-600" />
                <span>실제 걷기 감지 중 (모션 & GPS 센서)</span>
              </div>
              <p className="text-[10px] text-emerald-700 leading-tight mt-0.5">
                기기를 들고 실제로 걸으면 가속도계와 GPS가 감지하여 실시간으로 걸음수와 km가 올라갑니다!
              </p>
            </div>
          </div>

          {/* Live Motion Signal Meter */}
          <div className="flex items-end gap-1 h-5 px-2 py-1 rounded-lg bg-emerald-100/60 border border-emerald-200 shrink-0">
            <div
              className={`w-1 rounded-full transition-all ${
                motionIntensity > 10 ? 'h-3 bg-emerald-600' : 'h-1 bg-emerald-300'
              }`}
            />
            <div
              className={`w-1 rounded-full transition-all ${
                motionIntensity > 30 ? 'h-4 bg-emerald-600' : 'h-1 bg-emerald-300'
              }`}
            />
            <div
              className={`w-1 rounded-full transition-all ${
                motionIntensity > 60 ? 'h-5 bg-emerald-600' : 'h-1 bg-emerald-300'
              }`}
            />
          </div>
        </div>

        {sensorNotice && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold text-center">
            {sensorNotice}
          </div>
        )}

        {/* Active Walk Session Panel */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Timer size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">현재 산책 진행 시간</span>
              <span className="font-mono text-base font-extrabold text-slate-800">
                {formatTime(activeSessionSeconds)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block">이번 산책 감지 걸음</span>
            <span className="font-mono text-base font-black text-emerald-600">
              +{sessionSteps.toLocaleString()} <span className="text-xs font-normal text-slate-400">보</span>
            </span>
          </div>
        </div>

        {/* Steps Today Metric */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Footprints size={24} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400">오늘의 실측 걸음 수</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {todayRecord.steps.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-bold">/ {dailyGoal.toLocaleString()}보</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-extrabold text-blue-600">{goalPercent}% 달성</span>
            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Distance in km, Calories, Total Steps */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-bold mb-0.5">
              <MapPin size={12} className="text-emerald-500" />
              <span>실제 이동 거리</span>
            </div>
            <div className="text-base font-extrabold text-slate-800 font-mono">
              {todayRecord.distanceKm} <span className="text-[10px] font-normal text-slate-500">km</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-bold mb-0.5">
              <Flame size={12} className="text-orange-500" />
              <span>소모 칼로리</span>
            </div>
            <div className="text-base font-extrabold text-slate-800 font-mono">
              {todayRecord.caloriesBurned} <span className="text-[10px] font-normal text-slate-500">kcal</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-bold mb-0.5">
              <TrendingUp size={12} className="text-purple-500" />
              <span>총 누적 걸음</span>
            </div>
            <div className="text-base font-extrabold text-slate-800 font-mono">
              {totalSteps.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">보</span>
            </div>
          </div>
        </div>

        {/* Clear Notice: Zero Button Cheats */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Navigation size={13} className="text-blue-500" />
            <span className="text-[11px]">실제 발걸음과 GPS 이동만 측정됩니다</span>
          </div>
          <button
            onClick={handleRequestMotionPermission}
            className="text-slate-400 hover:text-blue-600 font-bold text-[11px] flex items-center gap-1"
          >
            <Smartphone size={12} />
            <span>센서 재연결</span>
          </button>
        </div>
      </div>

      {/* 3. BOTTOM ACTION BAR */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenFeeding();
          }}
          className="p-3 rounded-2xl bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 shadow-2xs text-center flex flex-col items-center gap-1 transition-all active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Utensils size={18} />
          </div>
          <span className="font-extrabold text-[11px] text-slate-800">포핀 & 간식</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenInventory();
          }}
          className="p-3 rounded-2xl bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-200 hover:border-purple-300 shadow-2xs text-center flex flex-col items-center gap-1 transition-all active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Package size={18} />
          </div>
          <span className="font-extrabold text-[11px] text-slate-800">도구함</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenPartnerSelect();
          }}
          className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 shadow-2xs text-center flex flex-col items-center gap-1 transition-all active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <RefreshCw size={18} />
          </div>
          <span className="font-extrabold text-[11px] text-slate-800">포켓몬 검색</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenFriends();
          }}
          className="p-3 rounded-2xl bg-gradient-to-tr from-blue-50 to-cyan-50 border border-blue-200 hover:border-blue-300 shadow-2xs text-center flex flex-col items-center gap-1 transition-all active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Users size={18} />
          </div>
          <span className="font-extrabold text-[11px] text-slate-800">친구 공유</span>
        </button>
      </div>

      {/* Sprite Attribution Footer */}
      <div className="text-center pt-2 text-[10px] text-slate-400">
        포켓몬 도트 스프라이트: <strong className="text-slate-500">PMD SpriteCollab (CC BY-NC 4.0)</strong>
      </div>
    </div>
  );
};
