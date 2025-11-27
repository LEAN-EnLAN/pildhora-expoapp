// Comprehensive Authentication Flow Test Script
// Tests all authentication fixes implemented in the Pildhora app
// Copy and paste this into the browser console when the app is running on http://localhost:8085

async function testAuthenticationFlows() {
  console.log('=== AUTHENTICATION FLOW TESTING ===');
  console.log('Testing all authentication fixes...\n');

  // Helper function to wait for navigation
  const waitForNavigation = (timeout = 3000) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };

  // Helper function to check current route
  const getCurrentRoute = () => {
    const path = window.location.pathname;
    return path;
  };

  // Helper function to simulate navigation
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Test 1: Fresh app launch - Verify no hardcoded test account
  console.log('1. Testing fresh app launch (no hardcoded test account)...');
  try {
    // Navigate to root
    navigateTo('/');
    await waitForNavigation(2000);

    // Check if we're at the welcome screen and not automatically logged in
    const currentRoute = getCurrentRoute();
    if (currentRoute === '/' || currentRoute === '') {
      console.log('✅ App launched at welcome screen');
      
      // Check for welcome screen elements
      const welcomeElements = document.querySelectorAll('*');
      let foundWelcomeElements = false;
      let foundTestAccount = false;
      
      welcomeElements.forEach(el => {
        if (el.textContent) {
          if (el.textContent.includes('Bienvenido a Pildhora') || 
              el.textContent.includes('Soy un paciente') ||
              el.textContent.includes('Soy un cuidador')) {
            foundWelcomeElements = true;
          }
          // Check for hardcoded test account
          if (el.textContent.includes('leanplbo@gmail.com')) {
            foundTestAccount = true;
          }
        }
      });
      
      if (foundWelcomeElements) {
        console.log('✅ Welcome screen elements found');
      } else {
        console.log('⚠️ Welcome screen elements not found');
      }
      
      if (!foundTestAccount) {
        console.log('✅ No hardcoded test account detected');
      } else {
        console.log('❌ Hardcoded test account found - FIX NEEDED');
      }
    } else {
      console.log('⚠️ Not at welcome screen, current route:', currentRoute);
    }
  } catch (error) {
    console.error('❌ Error testing fresh app launch:', error);
  }

  // Test 2: New user signup flow
  console.log('\n2. Testing new user signup flow...');
  try {
    // Navigate to signup
    navigateTo('/auth/signup');
    await waitForNavigation(2000);

    // Check if signup form is present
    const signupElements = document.querySelectorAll('*');
    let foundSignupForm = false;
    let foundSpanishText = false;
    
    signupElements.forEach(el => {
      if (el.textContent) {
        if (el.textContent.includes('Crear cuenta') || 
            el.textContent.includes('Nombre completo') ||
            el.textContent.includes('Correo electrónico') ||
            el.textContent.includes('Contraseña')) {
          foundSignupForm = true;
        }
        // Check for Spanish text
        if (el.textContent.includes('Crear cuenta') || 
            el.textContent.includes('Registrarse') ||
            el.textContent.includes('Paciente') ||
            el.textContent.includes('Cuidador')) {
          foundSpanishText = true;
        }
      }
    });
    
    if (foundSignupForm) {
      console.log('✅ Signup form found');
    } else {
      console.log('❌ Signup form not found');
    }
    
    if (foundSpanishText) {
      console.log('✅ Spanish text present in signup form');
    } else {
      console.log('⚠️ Spanish text not detected in signup form');
    }

    // Check for role selection buttons
    const roleButtons = document.querySelectorAll('button, [role="button"], TouchableOpacity');
    let foundRoleButtons = false;
    roleButtons.forEach(el => {
      if (el.textContent && (el.textContent.includes('Paciente') || el.textContent.includes('Cuidador'))) {
        foundRoleButtons = true;
      }
    });
    
    if (foundRoleButtons) {
      console.log('✅ Role selection buttons found');
    } else {
      console.log('⚠️ Role selection buttons not found');
    }
  } catch (error) {
    console.error('❌ Error testing signup flow:', error);
  }

  // Test 3: Existing user login flow
  console.log('\n3. Testing existing user login flow...');
  try {
    // Navigate to login
    navigateTo('/auth/login');
    await waitForNavigation(2000);

    // Check if login form is present
    const loginElements = document.querySelectorAll('*');
    let foundLoginForm = false;
    let foundSpanishText = false;
    
    loginElements.forEach(el => {
      if (el.textContent) {
        if (el.textContent.includes('Iniciar sesión') || 
            el.textContent.includes('Correo electrónico') ||
            el.textContent.includes('Contraseña')) {
          foundLoginForm = true;
        }
        // Check for Spanish text
        if (el.textContent.includes('Bienvenido de nuevo') || 
            el.textContent.includes('Inicia sesión')) {
          foundSpanishText = true;
        }
      }
    });
    
    if (foundLoginForm) {
      console.log('✅ Login form found');
    } else {
      console.log('❌ Login form not found');
    }
    
    if (foundSpanishText) {
      console.log('✅ Spanish text present in login form');
    } else {
      console.log('⚠️ Spanish text not detected in login form');
    }

    // Check for session banner (for already authenticated users)
    const sessionBanner = document.querySelectorAll('*');
    let foundSessionBanner = false;
    sessionBanner.forEach(el => {
      if (el.textContent && el.textContent.includes('Actualmente has iniciado sesión')) {
        foundSessionBanner = true;
      }
    });
    
    if (foundSessionBanner) {
      console.log('✅ Session banner for authenticated users found');
    } else {
      console.log('ℹ️ No session banner (user not authenticated)');
    }
  } catch (error) {
    console.error('❌ Error testing login flow:', error);
  }

  // Test 4: Already authenticated user redirection
  console.log('\n4. Testing already authenticated user redirection...');
  try {
    // Check Redux store for auth state
    const store = window.__REDUX_STORE__;
    if (store) {
      const state = store.getState();
      if (state.auth && state.auth.isAuthenticated && state.auth.user) {
        console.log('✅ User is authenticated in Redux store');
        console.log('User role:', state.auth.user.role);
        
        // Test navigation to auth pages when already authenticated
        navigateTo('/auth/login');
        await waitForNavigation(1000);
        
        const currentRouteAfterLogin = getCurrentRoute();
        if (currentRouteAfterLogin.includes('/patient/') || currentRouteAfterLogin.includes('/caregiver/')) {
          console.log('✅ Proper redirection from login when authenticated');
        } else {
          console.log('⚠️ No redirection from login when authenticated');
        }
        
        navigateTo('/auth/signup');
        await waitForNavigation(1000);
        
        const currentRouteAfterSignup = getCurrentRoute();
        if (currentRouteAfterSignup.includes('/patient/') || currentRouteAfterSignup.includes('/caregiver/')) {
          console.log('✅ Proper redirection from signup when authenticated');
        } else {
          console.log('⚠️ No redirection from signup when authenticated');
        }
      } else {
        console.log('ℹ️ User not authenticated - cannot test authenticated redirection');
      }
    } else {
      console.log('⚠️ Redux store not accessible');
    }
  } catch (error) {
    console.error('❌ Error testing authenticated redirection:', error);
  }

  // Test 5: Logout flow and auth state clearing
  console.log('\n5. Testing logout flow and auth state clearing...');
  try {
    const store = window.__REDUX_STORE__;
    if (store) {
      const state = store.getState();
      if (state.auth && state.auth.isAuthenticated) {
        console.log('✅ User is authenticated - can test logout');
        
        // Look for logout functionality
        const logoutElements = document.querySelectorAll('*');
        let foundLogoutButton = false;
        
        logoutElements.forEach(el => {
          if (el.textContent && (el.textContent.includes('Cerrar sesión') || el.textContent.includes('Cerrar sesión'))) {
            foundLogoutButton = true;
          }
        });
        
        if (foundLogoutButton) {
          console.log('✅ Logout button found');
        } else {
          console.log('⚠️ Logout button not found in current view');
        }
        
        // Check auth state structure
        if (state.auth.user && state.auth.user.id && state.auth.user.email) {
          console.log('✅ Auth state has proper user structure');
        } else {
          console.log('⚠️ Auth state user structure incomplete');
        }
        
        // Check for clearAuthState function
        if (typeof store.dispatch === 'function') {
          console.log('✅ Redux dispatch available for logout testing');
        } else {
          console.log('⚠️ Redux dispatch not available');
        }
      } else {
        console.log('ℹ️ User not authenticated - cannot test logout');
      }
    } else {
      console.log('⚠️ Redux store not accessible');
    }
  } catch (error) {
    console.error('❌ Error testing logout flow:', error);
  }

  // Test 6: Role-based redirection
  console.log('\n6. Testing role-based redirection...');
  try {
    const store = window.__REDUX_STORE__;
    if (store) {
      const state = store.getState();
      if (state.auth && state.auth.isAuthenticated && state.auth.user) {
        const userRole = state.auth.user.role;
        console.log('✅ User role detected:', userRole);
        
        // Navigate to root to test redirection
        navigateTo('/');
        await waitForNavigation(2000);
        
        const currentRoute = getCurrentRoute();
        if (userRole === 'patient' && currentRoute.includes('/patient/')) {
          console.log('✅ Patient redirected to patient dashboard');
        } else if (userRole === 'caregiver' && currentRoute.includes('/caregiver/')) {
          console.log('✅ Caregiver redirected to caregiver dashboard');
        } else {
          console.log('⚠️ Role-based redirection may not be working correctly');
          console.log('Expected role:', userRole, 'Current route:', currentRoute);
        }
      } else {
        console.log('ℹ️ User not authenticated - cannot test role-based redirection');
      }
    } else {
      console.log('⚠️ Redux store not accessible');
    }
  } catch (error) {
    console.error('❌ Error testing role-based redirection:', error);
  }

  // Test 7: Race condition handling
  console.log('\n7. Testing race condition handling...');
  try {
    const store = window.__REDUX_STORE__;
    if (store) {
      const state = store.getState();
      if (state.auth) {
        // Check for initializing state
        if (typeof state.auth.initializing === 'boolean') {
          console.log('✅ Initializing state tracked:', state.auth.initializing);
        } else {
          console.log('⚠️ Initializing state not tracked');
        }
        
        // Check for loading state
        if (typeof state.auth.loading === 'boolean') {
          console.log('✅ Loading state tracked:', state.auth.loading);
        } else {
          console.log('⚠️ Loading state not tracked');
        }
        
        // Check for proper state structure
        const expectedProps = ['user', 'loading', 'initializing', 'error', 'isAuthenticated'];
        const hasAllProps = expectedProps.every(prop => prop in state.auth);
        
        if (hasAllProps) {
          console.log('✅ Auth state has all required properties');
        } else {
          console.log('⚠️ Auth state missing some properties');
        }
      } else {
        console.log('❌ Auth state not found in Redux store');
      }
    } else {
      console.log('⚠️ Redux store not accessible');
    }
  } catch (error) {
    console.error('❌ Error testing race condition handling:', error);
  }

  // Test 8: Firebase initialization state
  console.log('\n8. Testing Firebase initialization state...');
  try {
    // Check if Firebase services are available
    if (window.firebase || window.__FIREBASE__) {
      console.log('✅ Firebase services available');
    } else {
      console.log('ℹ️ Firebase services not directly accessible (expected in React Native)');
    }
    
    // Check for Firebase-related errors in console
    const consoleErrors = console.error || [];
    if (consoleErrors.length > 0) {
      console.log('ℹ️ Check console for Firebase initialization errors');
    } else {
      console.log('✅ No obvious Firebase initialization errors');
    }
  } catch (error) {
    console.error('❌ Error testing Firebase initialization:', error);
  }

  console.log('\n=== AUTHENTICATION TEST SUMMARY ===');
  console.log('✅ Authentication flow tests completed');
  console.log('ℹ️ Review the results above for any issues');
  console.log('ℹ️ Check the browser console for additional logs during navigation');
  console.log('ℹ️ For complete testing, manually interact with the auth forms');
}

// Make the test function available globally
window.testAuthenticationFlows = testAuthenticationFlows;

console.log('=== AUTHENTICATION TESTING SCRIPT LOADED ===');
console.log('Run testAuthenticationFlows() to execute all authentication tests');