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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Listen for real-time user data updates
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Reset gamesToday if it's a new day
            const lastPlayed = data.lastPlayed?.toDate().toDateString();
            const today = new Date().toDateString();
            
            setUserData({
              ...data,
              gamesToday: lastPlayed === today ? data.gamesToday : 0
            });
          } else {
            // Initialize new user doc
            setDoc(userDocRef, { 
              isPremium: false, 
              gamesToday: 0, 
              lastPlayed: new Date(),
              email: user.email 
            });
          }
        });
        return () => unsubscribeDoc();
      } else {
        setUser(null);
        setUserData({ isPremium: false, gamesToday: 0 });
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

