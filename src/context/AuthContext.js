"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ isPremium: false, gamesToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDocRef = doc(db, "users", user.uid);
        
        // Cleanup previous listener if any
        if (unsubscribeDoc) unsubscribeDoc();

        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Safe date conversion (Handles both Firebase Timestamp and JS Date)
            let lastPlayedDate;
            if (data.lastPlayed?.toDate) {
              lastPlayedDate = data.lastPlayed.toDate();
            } else if (data.lastPlayed instanceof Date) {
              lastPlayedDate = data.lastPlayed;
            }

            const lastPlayed = lastPlayedDate?.toDateString();
            const today = new Date().toDateString();
            
            setUserData({
              ...data,
              gamesToday: lastPlayed === today ? data.gamesToday : 0
            });
          } else {
            setDoc(userDocRef, { 
              isPremium: false, 
              gamesToday: 0, 
              lastPlayed: new Date(),
              email: user.email 
            });
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData({ isPremium: false, gamesToday: 0 });
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

