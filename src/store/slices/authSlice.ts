import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { getAuthInstance, getDbInstance } from '../../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider, signInWithCredential, deleteUser } from 'firebase/auth';
import { configureGoogleSignin, signInWithGoogleNative } from '../../services/auth/google';
import { Platform } from 'react-native';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { convertTimestamps } from '../../utils/firestoreUtils';

interface AuthState {
  user: User | null;
  loading: boolean;
  initializing: boolean; // Track Firebase initialization state
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  initializing: true, // Start in initializing state
  error: null,
  isAuthenticated: false,
};

// Async thunk to update non-sensitive profile fields (e.g., display name)
// This intentionally avoids changing authentication credentials like email/password.
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    { name }: { name: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const auth = await getAuthInstance();
      const db = await getDbInstance();

      if (!auth || !db) {
        throw new Error('Firebase services not initialized');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const state = getState() as { auth: AuthState };
      const existingUser = state.auth.user;

      const userId = currentUser.uid;

      // Persist only safe profile fields to Firestore
      await setDoc(
        doc(db, 'users', userId),
        { name },
        { merge: true }
      );

      const updatedUser: User = existingUser
        ? { ...existingUser, name }
        : {
          id: userId,
          email: currentUser.email || '',
          name,
          role: 'patient',
          createdAt: new Date(),
          onboardingComplete: false,
          onboardingStep: 'device_provisioning',
        };

      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

// Async thunks
export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, name, role }: { email: string; password: string; name: string; role: 'patient' | 'caregiver' }, { rejectWithValue }) => {
    try {
      // Ensure Firebase is initialized before signing up
      const auth = await getAuthInstance();
      const db = await getDbInstance();

      if (!auth || !db) {
        throw new Error('Firebase services not initialized');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore with onboarding fields
      const userData: User = {
        id: user.uid,
        email: user.email!,
        name,
        role,
        createdAt: new Date(),
        onboardingComplete: false,
        onboardingStep: role === 'patient' ? 'device_provisioning' : 'device_connection',
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      return userData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Ensure Firebase is initialized before signing in
      const auth = await getAuthInstance();
      const db = await getDbInstance();

      if (!auth || !db) {
        throw new Error('Firebase services not initialized');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = convertTimestamps(userDoc.data()) as User;
        return userData;
      } else {
        throw new Error('User data not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (
    payload: { role?: 'patient' | 'caregiver' },
    { rejectWithValue }
  ) => {
    try {
      const auth = await getAuthInstance();
      const db = await getDbInstance();
      if (!auth || !db) {
        throw new Error('Firebase services not initialized');
      }

      configureGoogleSignin();

      let firebaseUser: FirebaseUser | null = null;

      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        firebaseUser = result.user;
      } else {
        const result = await signInWithGoogleNative();
        const { idToken } = result;
        if (!idToken) throw new Error('Missing Google idToken');
        const credential = GoogleAuthProvider.credential(idToken);
        const userCred = await signInWithCredential(auth, credential);
        firebaseUser = userCred.user;
      }

      if (!firebaseUser) throw new Error('Google sign-in failed');

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = convertTimestamps(userDoc.data()) as User;
        return userData;
      }

      const userRole = payload.role || 'patient';
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        role: userRole,
        createdAt: new Date(),
        onboardingComplete: false,
        onboardingStep: userRole === 'patient' ? 'device_provisioning' : 'device_connection',
      };
      await setDoc(userDocRef, userData);
      return userData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sign in with Google');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Ensure Firebase is initialized before signing out
      const auth = await getAuthInstance();

      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      await signOut(auth);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const auth = await getAuthInstance();
      const db = await getDbInstance();

      if (!auth || !db || !auth.currentUser) {
        throw new Error('Firebase services not initialized or user not logged in');
      }

      const uid = auth.currentUser.uid;

      // Delete from Firestore first (while we still have permission)
      await deleteDoc(doc(db, 'users', uid));

      // Delete from Auth
      await deleteUser(auth.currentUser);

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete account');
    }
  }
);

export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { rejectWithValue }) => {
    try {
      // Ensure Firebase is initialized before checking auth state
      const auth = await getAuthInstance();
      const db = await getDbInstance();

      if (!auth || !db) {
        throw new Error('Firebase services not initialized');
      }

      return new Promise<User | null>((resolve) => {
        console.log('[Auth] Checking authentication state...');
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            console.log('[Auth] Firebase user authenticated:', firebaseUser.uid);
            // Get user data from Firestore
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                const userData = convertTimestamps(userDoc.data()) as User;
                console.log('[Auth] User data loaded from Firestore:', userData);
                resolve(userData);
              } else {
                console.error('[Auth] User document not found in Firestore');
                resolve(null);
              }
            } catch (error) {
              console.error('[Auth] Error loading user data from Firestore:', error);
              resolve(null);
            }
          } else {
            console.log('[Auth] No authenticated Firebase user');
            resolve(null);
          }
          unsubscribe();
        });
      });
    } catch (error: any) {
      console.error('[Auth] Error checking auth state:', error);
      return rejectWithValue(error.message || 'Failed to check authentication state');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAuthState: (state) => {
      // Clear all auth state for logout or stale state cleanup
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initializing = false;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initializing = false;
      })
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initializing = false;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initializing = false;
      })
      .addCase(signInWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initializing = false;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initializing = false;
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.initializing = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initializing = false;
      })
      .addCase(checkAuthState.pending, (state) => {
        state.initializing = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.loading = false;
        state.initializing = false;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initializing = false;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.initializing = false;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, setLoading, setInitializing, setError, clearError, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
