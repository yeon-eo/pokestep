/**
 * Firebase backend for real friends.
 *
 * Firestore layout:
 *   codes/{code}                     -> { uid }            friend code -> user lookup
 *   trainers/{uid}                   -> public profile     name, partner, today's steps, streak
 *   trainers/{uid}/friends/{uid2}    -> { addedAt }        friendship (written to both sides)
 *   trainers/{uid}/cheers/{fromUid}  -> { date, fromName, at }  latest cheer from each friend
 *
 * The web config below is not a secret: access is controlled by firestore.rules.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCdfqeFefKuTChbh20vm5gQhHD-sKSw-wg',
  authDomain: 'pokestep-39f09.firebaseapp.com',
  projectId: 'pokestep-39f09',
  storageBucket: 'pokestep-39f09.firebasestorage.app',
  messagingSenderId: '908139991364',
  appId: '1:908139991364:web:aae8eb23543b9e679a0711',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const TRAINER_CODE_PATTERN = /^PK-\d{4}-\d{4}$/;

export interface OnlineProfile {
  code: string;
  name: string;
  partnerName: string;
  partnerPokedexNo: number;
  partnerStageName: string;
  partnerSprite: string;
  todaySteps: number;
  todayKey: string;
  totalSteps: number;
  streakDays: number;
}

export interface OnlineTrainer extends OnlineProfile {
  uid: string;
}

export interface ReceivedCheer {
  fromUid: string;
  fromName: string;
  date: string;
}

/** Signs in anonymously (once per browser) and resolves with the user. */
export function ensureSignedIn(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        unsub();
        if (user) {
          resolve(user);
          return;
        }
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err) {
          reject(err);
        }
      },
      reject
    );
  });
}

function randomCode(): string {
  const p1 = Math.floor(1000 + Math.random() * 9000);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  return `PK-${p1}-${p2}`;
}

/**
 * Makes sure this user owns a unique friend code and returns it.
 * Keeps the code the user already has when it is free (or already theirs).
 */
export async function claimTrainerCode(uid: string, preferred: string): Promise<string> {
  // A code already registered on the server for this account wins.
  const existing = await getDoc(doc(db, 'trainers', uid));
  const serverCode = existing.exists() ? (existing.data().code as string | undefined) : undefined;
  if (serverCode && TRAINER_CODE_PATTERN.test(serverCode)) {
    const owner = await getDoc(doc(db, 'codes', serverCode));
    if (owner.exists() && owner.data().uid === uid) return serverCode;
  }

  let candidate = TRAINER_CODE_PATTERN.test(preferred) ? preferred : randomCode();
  for (let attempt = 0; attempt < 8; attempt++) {
    const codeRef = doc(db, 'codes', candidate);
    const claimed = await runTransaction(db, async (tx) => {
      const snap = await tx.get(codeRef);
      if (!snap.exists()) {
        tx.set(codeRef, { uid });
        return true;
      }
      return snap.data().uid === uid;
    });
    if (claimed) return candidate;
    candidate = randomCode();
  }
  throw new Error('친구 코드를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
}

export async function publishProfile(uid: string, profile: OnlineProfile): Promise<void> {
  await setDoc(doc(db, 'trainers', uid), {
    ...profile,
    name: profile.name.slice(0, 20),
    partnerName: profile.partnerName.slice(0, 30),
    partnerStageName: profile.partnerStageName.slice(0, 30),
    todaySteps: Math.max(0, Math.round(profile.todaySteps)),
    totalSteps: Math.max(0, Math.round(profile.totalSteps)),
    streakDays: Math.max(0, Math.round(profile.streakDays)),
    updatedAt: serverTimestamp(),
  });
}

/** Adds a friend on both sides. Throws an Error with a user-facing message. */
export async function addFriendByCode(myUid: string, rawCode: string): Promise<void> {
  const code = rawCode.trim().toUpperCase();
  if (!TRAINER_CODE_PATTERN.test(code)) {
    throw new Error('친구 코드는 PK-1234-5678 형식이에요.');
  }
  const codeSnap = await getDoc(doc(db, 'codes', code));
  if (!codeSnap.exists()) {
    throw new Error('존재하지 않는 친구 코드예요. 코드를 다시 확인해주세요.');
  }
  const friendUid = codeSnap.data().uid as string;
  if (friendUid === myUid) {
    throw new Error('자신의 코드는 친구로 추가할 수 없어요.');
  }
  const friendProfile = await getDoc(doc(db, 'trainers', friendUid));
  if (!friendProfile.exists()) {
    throw new Error('아직 접속한 적 없는 트레이너예요. 친구가 앱을 한 번 열면 추가할 수 있어요.');
  }

  const batch = writeBatch(db);
  batch.set(doc(db, 'trainers', myUid, 'friends', friendUid), { addedAt: serverTimestamp() });
  batch.set(doc(db, 'trainers', friendUid, 'friends', myUid), { addedAt: serverTimestamp() });
  await batch.commit();
}

export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'trainers', myUid, 'friends', friendUid));
  batch.delete(doc(db, 'trainers', friendUid, 'friends', myUid));
  await batch.commit();
}

export async function sendCheer(
  myUid: string,
  friendUid: string,
  myName: string,
  todayKey: string
): Promise<void> {
  await setDoc(doc(db, 'trainers', friendUid, 'cheers', myUid), {
    date: todayKey,
    fromName: myName.slice(0, 20),
    at: serverTimestamp(),
  });
}

export function subscribeFriendIds(
  myUid: string,
  onChange: (uids: string[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'trainers', myUid, 'friends'),
    (snap) => onChange(snap.docs.map((d) => d.id)),
    onError
  );
}

export function subscribeTrainer(
  uid: string,
  onChange: (trainer: OnlineTrainer | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'trainers', uid),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const d = snap.data();
      onChange({
        uid,
        code: d.code ?? '',
        name: d.name ?? '트레이너',
        partnerName: d.partnerName ?? '',
        partnerPokedexNo: d.partnerPokedexNo ?? 0,
        partnerStageName: d.partnerStageName ?? '',
        partnerSprite: d.partnerSprite ?? '',
        todaySteps: d.todaySteps ?? 0,
        todayKey: d.todayKey ?? '',
        totalSteps: d.totalSteps ?? 0,
        streakDays: d.streakDays ?? 0,
      });
    },
    onError
  );
}

export function subscribeReceivedCheers(
  myUid: string,
  onChange: (cheers: ReceivedCheer[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'trainers', myUid, 'cheers'),
    (snap) =>
      onChange(
        snap.docs.map((d) => ({
          fromUid: d.id,
          fromName: (d.data().fromName as string) ?? '친구',
          date: (d.data().date as string) ?? '',
        }))
      ),
    onError
  );
}
