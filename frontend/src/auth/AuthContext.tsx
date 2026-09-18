import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string, 
    password: string, 
    profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'email'>
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function mapAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/invalid-email':
        return 'The email address is badly formatted.';
      case 'auth/too-many-requests':
        return 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.';
      default:
        return error.message || 'An unexpected authentication error occurred.';
    }
  }
  return 'An unexpected error occurred.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !auth.name) {
      // Firebase not configured, fetch backend identity for local/dev session
      fetch('/api/v1/cockpit/identity')
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((data) => {
          const devUser = {
            uid: 'local-dev-user',
            email: 'ananda.jana@railsync.gov.in',
            displayName: data.actor || 'Ananda Jana',
          } as unknown as User;
          const devProfile: UserProfile = {
            uid: 'local-dev-user',
            email: 'ananda.jana@railsync.gov.in',
            fullName: data.actor || 'Ananda Jana',
            role: data.role || 'Section Controller',
            department: 'Operations',
            employeeId: 'RS-1001',
            section: 'Howrah-Bardhaman Chord',
            createdAt: new Date().toISOString(),
          };
          setUser(devUser);
          setProfile(devProfile);
        })
        .catch(() => {
          const devUser = {
            uid: 'local-dev-user',
            email: 'ananda.jana@railsync.gov.in',
            displayName: 'Ananda Jana',
          } as unknown as User;
          const devProfile: UserProfile = {
            uid: 'local-dev-user',
            email: 'ananda.jana@railsync.gov.in',
            fullName: 'Ananda Jana',
            role: 'Section Controller',
            department: 'Operations',
            employeeId: 'RS-1001',
            section: 'Howrah-Bardhaman Chord',
            createdAt: new Date().toISOString(),
          };
          setUser(devUser);
          setProfile(devProfile);
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth || !auth.name) {
      throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to frontend/.env and restart Vite.');
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'email'>
  ) => {
    if (!auth || !auth.name) {
      throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to frontend/.env and restart Vite.');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const newProfile = {
        ...profileData,
        email: newUser.email,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', newUser.uid), newProfile);
      
      // Update local state without waiting for onAuthStateChanged if desired, 
      // but onAuthStateChanged will handle it.
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
