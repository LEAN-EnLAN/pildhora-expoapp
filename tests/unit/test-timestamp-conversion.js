// Test script to verify Timestamp conversion in auth state
// Run this in browser console after authentication

function testTimestampConversion() {
  console.log('=== TESTING TIMESTAMP CONVERSION ===');
  
  const store = window.__REDUX_STORE__;
  if (!store) {
    console.error('❌ Redux store not accessible');
    return;
  }
  
  const state = store.getState();
  console.log('Current auth state:', state.auth);
  
  if (state.auth.user) {
    console.log('✅ User found in auth state');
    
    // Check if createdAt is a string (ISO format) rather than a Timestamp object
    if (state.auth.user.createdAt) {
      console.log('createdAt type:', typeof state.auth.user.createdAt);
      console.log('createdAt value:', state.auth.user.createdAt);
      
      if (typeof state.auth.user.createdAt === 'string') {
        console.log('✅ Timestamp properly converted to ISO string');
        
        // Verify it's a valid ISO date
        const date = new Date(state.auth.user.createdAt);
        if (!isNaN(date.getTime())) {
          console.log('✅ ISO string represents a valid date');
        } else {
          console.log('❌ ISO string is not a valid date');
        }
      } else {
        console.log('❌ Timestamp not converted - still an object');
      }
    } else {
      console.log('ℹ️ No createdAt field in user object');
    }
  } else {
    console.log('ℹ️ No user in auth state - please authenticate first');
  }
  
  console.log('=== TIMESTAMP CONVERSION TEST COMPLETE ===');
}

// Make function available globally
window.testTimestampConversion = testTimestampConversion;

console.log('Timestamp conversion test loaded. Run testTimestampConversion() to execute.');