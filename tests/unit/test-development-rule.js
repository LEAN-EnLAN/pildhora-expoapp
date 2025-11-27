const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCg4LlXDlaGHqm0YNMwPtxZNjtLrJrGwy4",
  authDomain: "pildhora-app2.firebaseapp.com",
  projectId: "pildhora-app2",
  storageBucket: "pildhora-app2.firebasestorage.app",
  messagingSenderId: "749289645165",
  appId: "1:749289645165:web:a808284ee26b7599efcb64",
  databaseURL: "https://pildhora-app2-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testDevelopmentRule() {
  console.log('[TEST] Testing development rule status...');
  console.log('[TEST] Current system time:', new Date().toISOString());
  console.log('[TEST] Development rule expires: 2025-12-31T23:59:59.999Z');
  
  try {
    // Try to sign in with test credentials or create a test user
    const testEmail = 'test@pildhora.dev';
    const testPassword = 'test123456';
    
    console.log('[TEST] Attempting to sign in with test user...');
    let userCredential;
    
    try {
      userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('[TEST] Existing test user authentication successful:', userCredential.user.uid);
    } catch (signInError) {
      if (signInError.code === 'auth/user-not-found') {
        console.log('[TEST] Test user not found, creating new test user...');
        userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('[TEST] New test user created and authenticated:', userCredential.user.uid);
      } else {
        throw signInError;
      }
    }
    
    // Check if we can read a test document to verify rule evaluation
    const testDocRef = doc(db, 'deviceLinks', 'test-diagnostic');
    const testDoc = await getDoc(testDocRef);
    
    if (testDoc.exists()) {
      console.log('[TEST] Test document exists and is readable:', testDoc.data());
    } else {
      console.log('[TEST] Test document does not exist, creating it...');
      // Create the test document if it doesn't exist
      await setDoc(testDocRef, {
        createdBy: userCredential.user.uid,
        createdAt: serverTimestamp(),
        purpose: 'development-rule-diagnostic',
        test: true
      });
      console.log('[TEST] Test document created successfully');
      
      // Try reading it again to verify
      const testDocAfterCreate = await getDoc(testDocRef);
      console.log('[TEST] Test document read after creation:', testDocAfterCreate.exists());
    }
    
    console.log('[TEST] Development rule test completed successfully!');
  } catch (error) {
    console.error('[TEST] Failed to test development rule:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the test
testDevelopmentRule().then(() => {
  console.log('[TEST] Test execution completed');
  process.exit(0);
}).catch((error) => {
  console.error('[TEST] Test execution failed:', error);
  process.exit(1);
});