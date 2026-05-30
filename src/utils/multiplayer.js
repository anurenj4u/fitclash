import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';

/**
 * Generates a unique 6-digit numeric room code.
 */
export const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Network timeout: Please check your internet connection or try again.")), ms))
  ]);
};

/**
 * Creates a private multiplayer room.
 */
export const createRoom = async (user, exerciseMode, targetDistance) => {
  if (!user) throw new Error("User must be logged in to create a room.");

  const roomCode = generateRoomCode();
  const roomRef = doc(db, "sprint_rooms", roomCode);

  const roomData = {
    roomId: roomCode,
    hostUid: user.uid,
    hostEmail: user.email || user.displayName || 'Host',
    hostDistance: 0,
    guestUid: null,
    guestEmail: null,
    guestDistance: 0,
    status: 'waiting', // 'waiting' | 'ready' | 'countdown' | 'playing' | 'finished'
    exerciseMode,
    targetDistance,
    matchType: 'friend', // 'friend' | 'online'
    winner: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await withTimeout(setDoc(roomRef, roomData), 8000);
  } catch (e) {
    if (e.message.includes("offline")) {
      throw new Error("You appear to be offline. Please check your connection.");
    }
    throw e;
  }
  return roomData;
};

/**
 * Joins a private multiplayer room with a 6-digit code.
 */
export const joinRoom = async (user, roomCode) => {
  if (!user) throw new Error("User must be logged in to join a room.");
  if (!roomCode || roomCode.length !== 6) throw new Error("Invalid room code.");

  const roomRef = doc(db, "sprint_rooms", roomCode);
  let roomSnap;
  try {
    roomSnap = await withTimeout(getDoc(roomRef), 8000);
  } catch (e) {
    if (e.message.includes("offline") || e.message.includes("timeout")) {
      throw new Error("Network error: You appear to be offline or a firewall is blocking the connection.");
    }
    throw e;
  }

  if (!roomSnap.exists()) {
    throw new Error("Room not found. Please double check the code.");
  }

  const roomData = roomSnap.data();

  if (roomData.status !== 'waiting' || roomData.guestUid) {
    throw new Error("Room is already full or has started.");
  }

  if (roomData.hostUid === user.uid) {
    throw new Error("You cannot join your own room from the same account.");
  }

  try {
    await withTimeout(updateDoc(roomRef, {
      guestUid: user.uid,
      guestEmail: user.email || user.displayName || 'Friend',
      status: 'ready',
      updatedAt: serverTimestamp()
    }), 8000);
  } catch (e) {
    throw new Error("Failed to join room: Check your internet connection.");
  }

  return { ...roomData, guestUid: user.uid, guestEmail: user.email || 'Friend', status: 'ready' };
};

/**
 * Starts matchmaking by finding an open public online lobby or creating one.
 */
export const startMatchmaking = async (user, exerciseMode, targetDistance) => {
  if (!user) throw new Error("User must be logged in for matchmaking.");

  const roomsRef = collection(db, "sprint_rooms");
  // Look for any open online lobby with matching parameters
  const q = query(
    roomsRef,
    where("matchType", "==", "online"),
    where("status", "==", "waiting"),
    where("exerciseMode", "==", exerciseMode),
    where("targetDistance", "==", targetDistance),
    limit(5) // Get a few candidates
  );

  let querySnapshot;
  try {
    querySnapshot = await withTimeout(getDocs(q), 8000);
  } catch (e) {
    throw new Error("Matchmaking failed: Network issue or you are offline.");
  }
  
  let availableRoom = null;

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    // Exclude rooms created by the same user to avoid matching with oneself
    if (data.hostUid !== user.uid) {
      availableRoom = data;
      break;
    }
  }

  if (availableRoom) {
    // Join existing room
    const roomRef = doc(db, "sprint_rooms", availableRoom.roomId);
    await updateDoc(roomRef, {
      guestUid: user.uid,
      guestEmail: user.email || user.displayName || 'Opponent',
      status: 'ready',
      updatedAt: serverTimestamp()
    });
    return { roomId: availableRoom.roomId, role: 'guest' };
  } else {
    // Create new online matchmaking room and wait
    const roomCode = generateRoomCode();
    const roomRef = doc(db, "sprint_rooms", roomCode);
    const roomData = {
      roomId: roomCode,
      hostUid: user.uid,
      hostEmail: user.email || user.displayName || 'You',
      hostDistance: 0,
      guestUid: null,
      guestEmail: null,
      guestDistance: 0,
      status: 'waiting',
      exerciseMode,
      targetDistance,
      matchType: 'online',
      winner: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      await withTimeout(setDoc(roomRef, roomData), 8000);
    } catch (e) {
      throw new Error("Failed to create online room. Please check your connection.");
    }
    return { roomId: roomCode, role: 'host' };
  }
};

/**
 * Cleans up or leaves a lobby.
 */
export const leaveLobby = async (roomId, role, uid) => {
  if (!roomId) return;
  const roomRef = doc(db, "sprint_rooms", roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data();

    if (role === 'host') {
      // If host leaves, we can close/finish the room or delete it
      await updateDoc(roomRef, {
        status: 'finished',
        winner: 'cancelled',
        updatedAt: serverTimestamp()
      });
    } else if (role === 'guest' && roomData.guestUid === uid) {
      // If guest leaves, revert status back to waiting so someone else can join
      await updateDoc(roomRef, {
        guestUid: null,
        guestEmail: null,
        status: 'waiting',
        updatedAt: serverTimestamp()
      });
    }
  } catch (e) {
    console.error("Error leaving lobby:", e);
  }
};
