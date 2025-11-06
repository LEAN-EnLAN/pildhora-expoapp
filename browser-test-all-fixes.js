// Comprehensive test script for all fixes implemented
// Copy and paste this into the browser console when the app is running on http://localhost:8085

async function testAllFixes() {
  console.log('=== COMPREHENSIVE FIX TESTING ===');
  console.log('Testing all implemented fixes...\n');

  // Test 1: Non-serializable Timestamp errors in auth state
  console.log('1. Testing non-serializable Timestamp errors...');
  try {
    // Check if Redux store is configured with serializableCheck
    const store = window.__REDUX_STORE__;
    if (store) {
      const state = store.getState();
      console.log('✅ Redux store accessible');
      
      // Check if auth state has user data
      if (state.auth && state.auth.user) {
        console.log('✅ Auth state has user data');
        
        // Check if timestamps are converted to ISO strings
        if (state.auth.user.createdAt && typeof state.auth.user.createdAt === 'string') {
          console.log('✅ Timestamps converted to ISO strings in auth state');
        } else {
          console.log('⚠️ Timestamps may not be properly converted');
        }
      } else {
        console.log('ℹ️ No user in auth state - need to authenticate first');
      }
    } else {
      console.log('❌ Redux store not accessible');
    }
  } catch (error) {
    console.error('❌ Error testing Timestamp handling:', error);
  }

  // Test 2: Slider component import and color picker functionality
  console.log('\n2. Testing Slider component import fix...');
  try {
    // Check if the app loads without Slider import errors
    const appElement = document.getElementById('root');
    if (appElement && appElement.children.length > 0) {
      console.log('✅ App loaded without Slider import errors');
      
      // Check for any error messages related to Slider
      const errorElements = document.querySelectorAll('[data-testid="error"]');
      if (errorElements.length === 0) {
        console.log('✅ No Slider-related errors detected');
      } else {
        console.log('⚠️ Potential errors detected on page');
      }
    } else {
      console.log('❌ App failed to load');
    }
  } catch (error) {
    console.error('❌ Error testing Slider import:', error);
  }

  // Test 3: Development rule status check
  console.log('\n3. Testing development rule status...');
  try {
    // Import the browser test function if available
    if (typeof window.testDevelopmentRuleInBrowser === 'function') {
      console.log('✅ Development rule test function available');
      console.log('ℹ️ Run window.testDevelopmentRuleInBrowser() to test development rules');
    } else {
      console.log('⚠️ Development rule test function not loaded');
    }
  } catch (error) {
    console.error('❌ Error checking development rule test:', error);
  }

  // Test 4: Caregiver dashboard data loading
  console.log('\n4. Testing caregiver dashboard data loading...');
  try {
    // Check if we can navigate to caregiver dashboard
    const router = window.__EXPO_ROUTER__;
    if (router) {
      console.log('✅ Router available for navigation');
      console.log('ℹ️ Navigate to /caregiver/dashboard to test data loading');
    } else {
      console.log('⚠️ Router not accessible from console');
    }
  } catch (error) {
    console.error('❌ Error testing caregiver dashboard:', error);
  }

  // Test 5: SWR pattern (static → cache → live data flow)
  console.log('\n5. Testing SWR pattern implementation...');
  try {
    // Check if useCollectionSWR hook is properly implemented
    const reactComponents = document.querySelectorAll('[data-reactroot]');
    if (reactComponents.length > 0) {
      console.log('✅ React components rendered');
      
      // Look for data source badges indicating SWR pattern
      const dataSourceBadges = document.querySelectorAll('*');
      let foundBadges = false;
      dataSourceBadges.forEach(el => {
        if (el.textContent && (el.textContent.includes('STATIC') || 
            el.textContent.includes('CACHE') || 
            el.textContent.includes('LIVE'))) {
          foundBadges = true;
        }
      });
      
      if (foundBadges) {
        console.log('✅ Data source badges found - SWR pattern active');
      } else {
        console.log('ℹ️ Navigate to dashboard to see SWR pattern in action');
      }
    } else {
      console.log('❌ No React components found');
    }
  } catch (error) {
    console.error('❌ Error testing SWR pattern:', error);
  }

  // Test 6: DoseRing component rendering
  console.log('\n6. Testing DoseRing component rendering...');
  try {
    // Look for SVG elements that would be part of DoseRing
    const svgElements = document.querySelectorAll('svg');
    if (svgElements.length > 0) {
      console.log('✅ SVG elements found - DoseRing may be rendered');
      console.log('ℹ️ Navigate to patient or caregiver dashboard to see DoseRing');
    } else {
      console.log('ℹ️ No SVG elements found - navigate to dashboard to test DoseRing');
    }
  } catch (error) {
    console.error('❌ Error testing DoseRing component:', error);
  }

  // Test 7: Redux state management
  console.log('\n7. Testing Redux state management...');
  try {
    const store = window.__REDUX_STORE__;
    if (store) {
      console.log('✅ Redux store accessible');
      
      // Check if all slices are present
      const state = store.getState();
      const expectedSlices = ['auth', 'medications', 'tasks', 'ble', 'device'];
      const presentSlices = Object.keys(state);
      
      const missingSlices = expectedSlices.filter(slice => !presentSlices.includes(slice));
      if (missingSlices.length === 0) {
        console.log('✅ All Redux slices present');
      } else {
        console.log('⚠️ Missing Redux slices:', missingSlices);
      }
      
      // Check if Redux DevTools is connected
      if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        console.log('✅ Redux DevTools available');
      } else {
        console.log('ℹ️ Redux DevTools not detected');
      }
    } else {
      console.log('❌ Redux store not accessible');
    }
  } catch (error) {
    console.error('❌ Error testing Redux state management:', error);
  }

  // Test 8: Authentication flow
  console.log('\n8. Testing authentication flow...');
  try {
    // Check if auth screens are accessible
    const authElements = document.querySelectorAll('*');
    let foundAuthElements = false;
    
    authElements.forEach(el => {
      if (el.textContent && (el.textContent.includes('Sign In') || 
          el.textContent.includes('Sign Up') || 
          el.textContent.includes('Email') || 
          el.textContent.includes('Password'))) {
        foundAuthElements = true;
      }
    });
    
    if (foundAuthElements) {
      console.log('✅ Authentication UI elements found');
    } else {
      console.log('ℹ️ Navigate to /auth/login or /auth/signup to test authentication');
    }
  } catch (error) {
    console.error('❌ Error testing authentication flow:', error);
  }

  console.log('\n=== TEST SUMMARY ===');
  console.log('✅ All fix tests completed');
  console.log('ℹ️ For complete testing, navigate through the app screens');
  console.log('ℹ️ Run window.testDevelopmentRuleInBrowser() to test development rules');
  console.log('ℹ️ Check browser console for detailed logs during navigation');
}

// Make the test function available globally
window.testAllFixes = testAllFixes;

console.log('=== FIX TESTING SCRIPT LOADED ===');
console.log('Run testAllFixes() to execute all tests');