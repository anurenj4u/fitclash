"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Brain } from "lucide-react";

export default function GlobalRefreshAlert() {
  const { user, loading } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState(null); // 'challenge' | 'coach'

  useEffect(() => {
    if (!loading) {
      // Show alert after a short delay so it doesn't just flash instantly
      const timer = setTimeout(() => {
        setAlertType(user ? "coach" : "challenge");
        setShowAlert(true);
      }, 500);

      // Auto-hide the alert after 8 seconds
      const hideTimer = setTimeout(() => {
        setShowAlert(false);
      }, 8500);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [loading, user]);

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: -50, scale: 0.9, x: "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            zIndex: 99999,
            background: "rgba(20, 20, 20, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "16px 24px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            width: "max-content",
            maxWidth: "90vw",
          }}
        >
          {alertType === "challenge" ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' }}>
              <Trophy size={20} color="#fff" />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
              <Brain size={20} color="#fff" />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "16px", fontFamily: "var(--font-inter, sans-serif)", margin: 0 }}>
              {alertType === "challenge" ? "Challenge Alert" : "AI Coach Alert"}
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", fontFamily: "var(--font-inter, sans-serif)", marginTop: "2px" }}>
              {alertType === "challenge" 
                ? "Log in to join the World Cup Fitness Challenge!" 
                : "Your AI Coach is ready for your next session."}
            </span>
          </div>

          <button 
            onClick={() => setShowAlert(false)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              marginLeft: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.5)",
              transition: "color 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
