// Browser console test for development rule status check
// Copy and paste this into the browser console when the app is running

async function testDevelopmentRuleInBrowser() {
  console.log('[BROWSER TEST] Testing development rule status...');
  console.log('[BROWSER TEST] Current system time:', new Date().toISOString());
  console.log('[BROWSER TEST] Development rule expires: 2025-12-31T23:59:59.999Z');
  
  try {
    // Import the necessary Firebase modules from the app
    const { db, auth } = window.firebase || {};
    if (!db || !auth) {
      console.error('[BROWSER TEST] Firebase not available in window object');
      return;
    }
    
    // Check authentication state
    const currentUser = auth.currentUser;
    console.log('[BROWSER TEST] Authentication state:', {
      isAuthenticated: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email
    });
    
    if (!currentUser) {
      console.error('[BROWSER TEST] No authenticated user. Please log in first.');
      return;
    }
    
    // Import Firestore functions
    const { doc, getDoc, setDoc, serverTimestamp } = window.firebase.firestore;
    
    // Check if we can read a test document to verify rule evaluation
    const testDocRef = doc(db, 'deviceLinks', 'test-diagnostic');
    const testDoc = await getDoc(testDocRef);
    
    if (testDoc.exists()) {
      console.log('[BROWSER TEST] Test document exists and is readable:', testDoc.data());
      console.log('[BROWSER TEST] ✅ Development rule is working correctly - document is readable');
    } else {
      console.log('[BROWSER TEST] Test document does not exist, creating it...');
      // Create the test document if it doesn't exist
      await setDoc(testDocRef, {
        createdBy: currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        purpose: 'development-rule-diagnostic',
        test: true
      });
      console.log('[BROWSER TEST] Test document created successfully');
      
      // Try reading it again to verify
      const testDocAfterCreate = await getDoc(testDocRef);
      if (testDocAfterCreate.exists()) {
        console.log('[BROWSER TEST] ✅ Development rule is working correctly - document created and readable');
      } else {
        console.log('[BROWSER TEST] ❌ Development rule issue - document created but not readable');
      }
    }
  } catch (error) {
    console.error('[BROWSER TEST] ❌ Failed to read/create test document:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Provide specific guidance based on error code
    if (error.code === 'permission-denied') {
      console.log('[BROWSER TEST] ❌ Permission denied - development rule may not be active or properly deployed');
    } else if (error.code === 'unavailable') {
      console.log('[BROWSER TEST] ❌ Service unavailable - check network connection');
    } else {
      console.log('[BROWSER TEST] ❌ Unexpected error - check Firebase configuration');
    }
  }
}

// Make the test function available globally
window.testDevelopmentRuleInBrowser = testDevelopmentRuleInBrowser;

console.log('[BROWSER TEST] Test function loaded. Run testDevelopmentRuleInBrowser() to execute the test.');