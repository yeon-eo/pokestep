import React, { useState } from 'react';
import { PartnerPokemon, EvolutionStage } from '../types/pokemon';
import { OnlineTrainer, ReceivedCheer } from '../utils/firebase';
import { SyncStatus } from '../hooks/useFriendsSync';
import { soundManager } from '../utils/audio';
import {
  Users,
  Copy,
  Check,
  Plus,
  Heart,
  Sparkles,
  Footprints,
  Trash2,
  X,
  Loader2,
  WifiOff,
} from 'lucide-react';

interface FriendsModalProps {
  myTrainerCode: string | null;
  myTrainerName: string;
  myPartner: PartnerPokemon | null;
  myCurrentStage: EvolutionStage;
  myTodaySteps: number;
  todayKey: string;
  syncStatus: SyncStatus;
  syncError: string | null;
  friends: OnlineTrainer[];
  friendCount: number;
  receivedCheers: ReceivedCheer[];
  sentCheers: Record<string, string>;
  onAddFriend: (code: string) => Promise<void>;
  onRemoveFriend: (friendUid: string) => Promise<void>;
  onCheerFriend: (friendUid: string) => Promise<void>;
  onUpdateTrainerName: (newName: string) => void;
  onClose: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  myTrainerCode,
  myTrainerName,
  myPartner,
  myCurrentStage,
  myTodaySteps,
  todayKey,
  syncStatus,
  syncError,
  friends,
  friendCount,
  receivedCheers,
  sentCheers,
  onAddFriend,
  onRemoveFriend,
  onCheerFriend,
  onUpdateTrainerName,
  onClose,
}) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(myTrainerName);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [busyFriend, setBusyFriend] = useState<string | null>(null);

  const isOnline = syncStatus === 'online';

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCopyCode = () => {
    if (!myTrainerCode) return;
    soundManager.playClick();
    navigator.clipboard.writeText(myTrainerCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('친구 코드를 입력해주세요.');
      return;
    }
    setIsAdding(true);
    setErrorMsg(null);
    try {
      await onAddFriend(cleanCode);
      setInputCode('');
      flashSuccess('친구를 추가했어요! 서로의 걸음수가 공유됩니다.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '친구를 추가하지 못했어요.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCheer = async (fr: OnlineTrainer) => {
    soundManager.playFeed();
    setBusyFriend(fr.uid);
    try {
      await onCheerFriend(fr.uid);
      flashSuccess(`${fr.name}님에게 응원을 보냈어요!`);
    } catch {
      setErrorMsg('응원을 보내지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusyFriend(null);
    }
  };

  const handleRemove = async (fr: OnlineTrainer) => {
    if (!confirm(`친구 [${fr.name}]님을 목록에서 삭제하시겠습니까?`)) return;
    setBusyFriend(fr.uid);
    try {
      await onRemoveFriend(fr.uid);
    } catch {
      setErrorMsg('친구를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusyFriend(null);
    }
  };

  // A friend's step count only counts for today if they updated it today
  const stepsToday = (fr: OnlineTrainer) => (fr.todayKey === todayKey ? fr.todaySteps : 0);
  const sortedFriends = [...friends].sort((a, b) => stepsToday(b) - stepsToday(a));
  const todaysCheers = receivedCheers.filter((c) => c.date === todayKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden text-slate-800">
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
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
            <Users size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 font-['Gaegu'] text-2xl">
              친구 산책 공유 & 친구 코드
            </h3>
            <p className="text-xs text-slate-500">
              친구 코드를 주고받으면 서로의 파트너와 걸음수를 실시간으로 볼 수 있어요!
            </p>
          </div>
        </div>

        {/* Connection status */}
        {syncStatus === 'connecting' && (
          <div className="mb-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5">
            <Loader2 size={14} className="animate-spin" />
            <span>서버에 연결하는 중...</span>
          </div>
        )}
        {syncStatus === 'error' && (
          <div className="mb-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-1.5">
            <WifiOff size={14} />
            <span>{syncError || '서버에 연결하지 못했어요.'}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-2 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 animate-fade-in">
            <Sparkles size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. MY TRAINER CODE CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">내 트레이너 프로필</span>
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      maxLength={10}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="px-2 py-0.5 rounded border border-blue-300 text-xs font-bold w-24"
                    />
                    <button
                      onClick={() => {
                        onUpdateTrainerName(nameInput.trim() || '트레이너');
                        setIsEditingName(false);
                      }}
                      className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold"
                    >
                      저장
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="font-extrabold text-sm text-slate-900 underline decoration-dotted"
                    title="클릭하여 이름 변경"
                  >
                    {myTrainerName} ✎
                  </button>
                )}
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                MY PROFILE
              </span>
            </div>

            <div className="flex items-center justify-between bg-white/90 p-3 rounded-xl border border-blue-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">내 친구 코드</span>
                <span className="text-base font-black font-mono tracking-wider text-blue-700">
                  {myTrainerCode ?? '발급 중...'}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                disabled={!myTrainerCode}
                className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? '복사됨!' : '코드 복사'}</span>
              </button>
            </div>

            {/* My Current Partner Preview */}
            {myPartner && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-100 text-slate-600">
                <div className="flex items-center gap-2">
                  <img
                    src={myCurrentStage.animatedSprite || myCurrentStage.sprite}
                    alt=""
                    style={{ imageRendering: 'pixelated' }}
                    className="w-7 h-7 object-contain pixelated"
                  />
                  <span>
                    파트너: <strong className="text-slate-800">{myPartner.nickname}</strong> ({myCurrentStage.name})
                  </span>
                </div>
                <div>
                  오늘: <strong className="text-blue-600 font-mono">{myTodaySteps.toLocaleString()}보</strong>
                </div>
              </div>
            )}
          </div>

          {/* Cheers received today */}
          {todaysCheers.length > 0 && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-start gap-2">
              <Heart size={14} className="fill-rose-500 text-rose-500 shrink-0 mt-0.5" />
              <span>
                오늘 {todaysCheers.map((c) => c.fromName).join(', ')}님이 응원을 보냈어요!
              </span>
            </div>
          )}

          {/* 2. ADD FRIEND BY CODE */}
          <form onSubmit={handleAddByCode} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              친구 코드로 추가하기
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="예: PK-1234-5678"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
              <button
                type="submit"
                disabled={!isOnline || isAdding}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
              >
                {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span>친구 추가</span>
              </button>
            </div>
            {errorMsg && <p className="text-xs font-bold text-red-500">{errorMsg}</p>}
          </form>

          {/* 3. FRIENDS LEADERBOARD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Footprints size={15} className="text-blue-500" />
                <span>친구 산책 랭킹 ({friendCount}명)</span>
              </span>
              <span className="text-[10px] text-slate-400">오늘 걸음수 순</span>
            </div>

            {friendCount === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs leading-relaxed">
                아직 등록된 친구가 없어요.
                <br />
                내 친구 코드를 친구에게 보내거나, 친구의 코드를 입력해보세요!
              </div>
            ) : sortedFriends.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                친구 정보를 불러오는 중...
              </div>
            ) : (
              <div className="space-y-2">
                {sortedFriends.map((fr, idx) => {
                  const cheeredToday = sentCheers[fr.uid] === todayKey;
                  const busy = busyFriend === fr.uid;
                  return (
                    <div
                      key={fr.uid}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-200 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-5 text-center font-black text-xs text-slate-400">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                          {fr.partnerSprite && (
                            <img
                              src={fr.partnerSprite}
                              alt={fr.partnerName}
                              style={{ imageRendering: 'pixelated' }}
                              className="w-10 h-10 object-contain drop-shadow-xs pixelated"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-800 truncate">{fr.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">({fr.code})</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="truncate">
                              파트너: <strong>{fr.partnerName || fr.partnerStageName}</strong>
                            </span>
                            {fr.streakDays > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-orange-500 font-bold shrink-0">🔥 {fr.streakDays}일 연속</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <div className="font-mono text-sm font-black text-blue-600">
                          {stepsToday(fr).toLocaleString()}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">보</span>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCheer(fr)}
                            disabled={cheeredToday || busy || !isOnline}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                              cheeredToday
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-2xs hover:from-rose-400 hover:to-pink-400 disabled:opacity-50'
                            }`}
                          >
                            <Heart size={11} className={cheeredToday ? 'fill-rose-500' : ''} />
                            <span>{cheeredToday ? '응원완료' : '응원하기'}</span>
                          </button>
                          <button
                            onClick={() => handleRemove(fr)}
                            disabled={busy || !isOnline}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-red-500 transition-colors"
                            title="친구 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
