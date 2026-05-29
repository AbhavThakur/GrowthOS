import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();
const ALLOWED_AUTH_EMAILS = (import.meta.env.VITE_ALLOWED_AUTH_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Lightweight offline user — lets the app run fully without Firebase
const OFFLINE_USER = {
  uid: "__local__",
  email: null,
  displayName: "Local Mode",
  isOffline: true,
};

async function assertAllowedUser(firebaseUser) {
  if (ALLOWED_AUTH_EMAILS.length === 0) return;
  const email = firebaseUser?.email?.toLowerCase();
  if (email && ALLOWED_AUTH_EMAILS.includes(email)) return;

  await signOut(auth);
  throw new Error("auth/unauthorized-email");
}

export function AuthProvider({ children }) {
  // undefined  = still resolving
  // null       = not signed in
  // object     = signed-in user (or OFFLINE_USER)
  // If Firebase isn't configured, initialize directly to OFFLINE_USER
  const [user, setUser] = useState(() => (!auth ? OFFLINE_USER : undefined));

  useEffect(() => {
    // If Firebase isn't configured (no env vars), go straight to offline mode
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => setUser(u ?? null));
  }, []);

  const login = async (email, password, remember = true) => {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    const result = await signInWithEmailAndPassword(auth, email, password);
    await assertAllowedUser(result.user);
    return result;
  };

  const signup = async (email, password) => {
    await setPersistence(auth, browserLocalPersistence);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await assertAllowedUser(result.user);
    return result;
  };

  const loginWithGoogle = async (remember = true) => {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    const result = await signInWithPopup(auth, googleProvider);
    await assertAllowedUser(result.user);
    return result;
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const continueOffline = () => setUser(OFFLINE_USER);

  const logout = () => {
    if (user?.isOffline) {
      setUser(null);
      return;
    }
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        continueOffline,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
