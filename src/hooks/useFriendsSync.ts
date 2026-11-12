import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ensureSignedIn,
  claimTrainerCode,
  publishProfile,
  addFriendByCode,
  removeFriend as removeFriendOnline,
  sendCheer,
  subscribeFriendIds,
  subscribeTrainer,
  subscribeReceivedCheers,
  OnlineProfile,
  OnlineTrainer,
  ReceivedCheer,
} from '../utils/firebase';

export type SyncStatus = 'connecting' | 'online' | 'error';

const PUBLISH_DEBOUNCE_MS = 20000; // while walking, push step updates at most every 20s
const SENT_CHEERS_KEY = 'pokestep_sent_cheers_v1';

function loadSentCheers(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SENT_CHEERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSentCheers(map: Record<string, string>) {
  try {
    localStorage.setItem(SENT_CHEERS_KEY, JSON.stringify(map));
  } catch {}
}

interface Options {
  /** Profile to publish; `code` is the locally stored preferred code. */
  profile: OnlineProfile;
  /** Called when the server assigns a different code than the local one. */
  onCodeAssigned: (code: string) => void;
  /** Live friend data is only streamed while this is true (friends screen open). */
  watchFriends: boolean;
}

export function useFriendsSync({ profile, onCodeAssigned, watchFriends }: Options) {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendData, setFriendData] = useState<Record<string, OnlineTrainer | null>>({});
  const [receivedCheers, setReceivedCheers] = useState<ReceivedCheer[]>([]);
  const [sentCheers, setSentCheers] = useState<Record<string, string>>(() => loadSentCheers());

  const profileRef = useRef(profile);
  profileRef.current = profile;
  const onCodeAssignedRef = useRef(onCodeAssigned);
  onCodeAssignedRef.current = onCodeAssigned;
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPublishedRef = useRef<string>('');

  const fail = useCallback((err: unknown) => {
    console.warn('Friends sync error:', err);
    setStatus('error');
    setErrorMessage('서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.');
  }, []);

  // 1. Sign in and claim a unique friend code.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await ensureSignedIn();
        const claimed = await claimTrainerCode(user.uid, profileRef.current.code);
        if (cancelled) return;
        setUid(user.uid);
        setCode(claimed);
        if (claimed !== profileRef.current.code) onCodeAssignedRef.current(claimed);
        setStatus('online');
        setErrorMessage(null);
      } catch (err) {
        if (!cancelled) fail(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fail]);

  // 2. Publish my profile (immediately at first, then debounced).
  const publishNow = useCallback(async () => {
    if (!uid || !code) return;
    const payload: OnlineProfile = { ...profileRef.current, code };
    const key = JSON.stringify(payload);
    if (key === lastPublishedRef.current) return;
    try {
      await publishProfile(uid, payload);
      lastPublishedRef.current = key;
    } catch (err) {
      fail(err);
    }
  }, [uid, code, fail]);

  useEffect(() => {
    if (!uid || !code) return;
    if (!lastPublishedRef.current) {
      publishNow();
      return;
    }
    if (publishTimerRef.current) return; // an update is already scheduled
    publishTimerRef.current = setTimeout(() => {
      publishTimerRef.current = null;
      publishNow();
    }, PUBLISH_DEBOUNCE_MS);
  }, [uid, code, profile, publishNow]);

  // Flush pending changes when the page is hidden or the friends screen opens.
  useEffect(() => {
    const flush = () => {
      if (publishTimerRef.current) {
        clearTimeout(publishTimerRef.current);
        publishTimerRef.current = null;
      }
      publishNow();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    if (watchFriends) flush();
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [publishNow, watchFriends]);

  useEffect(
    () => () => {
      if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
    },
    []
  );

  // 3. Friend list + cheers I received (always, they are small).
  useEffect(() => {
    if (!uid) return;
    const unsubFriends = subscribeFriendIds(uid, setFriendIds, fail);
    const unsubCheers = subscribeReceivedCheers(uid, setReceivedCheers, fail);
    return () => {
      unsubFriends();
      unsubCheers();
    };
  }, [uid, fail]);

  // 4. Each friend's live profile, only while the friends screen is open.
  useEffect(() => {
    if (!uid || !watchFriends) return;
    const unsubs = friendIds.map((fid) =>
      subscribeTrainer(
        fid,
        (trainer) => setFriendData((prev) => ({ ...prev, [fid]: trainer })),
        fail
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [uid, watchFriends, friendIds, fail]);

  const friends: OnlineTrainer[] = friendIds
    .map((fid) => friendData[fid])
    .filter((t): t is OnlineTrainer => !!t);

  const addFriend = useCallback(
    async (rawCode: string) => {
      if (!uid) throw new Error('아직 서버에 연결 중이에요. 잠시 후 다시 시도해주세요.');
      await addFriendByCode(uid, rawCode);
    },
    [uid]
  );

  const removeFriend = useCallback(
    async (friendUid: string) => {
      if (!uid) return;
      await removeFriendOnline(uid, friendUid);
    },
    [uid]
  );

  const cheer = useCallback(
    async (friendUid: string) => {
      if (!uid) return;
      const today = profileRef.current.todayKey;
      await sendCheer(uid, friendUid, profileRef.current.name, today);
      setSentCheers((prev) => {
        const next = { ...prev, [friendUid]: today };
        saveSentCheers(next);
        return next;
      });
    },
    [uid]
  );

  return {
    status,
    errorMessage,
    myCode: code,
    friends,
    friendCount: friendIds.length,
    receivedCheers,
    sentCheers,
    addFriend,
    removeFriend,
    cheer,
  };
}
