/**
 * Network connectivity utility for Firebase services
 * Helps diagnose DNS and connectivity issues
 */

export const checkFirebaseConnectivity = async (): Promise<{
  apisGoogle: boolean;
  identityToolkit: boolean;
  firestore: boolean;
}> => {
  const results = {
    apisGoogle: false,
    identityToolkit: false,
    firestore: false,
  };

  try {
    // Check Google APIs connectivity
    const apisResponse = await fetch('https://apis.google.com/js/api.js', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    results.apisGoogle = true;
  } catch (error) {
    console.error('[Network] Failed to connect to apis.google.com:', error);
  }

  try {
    // Check Firebase Identity Toolkit connectivity
    const identityResponse = await fetch(
      'https://identitytoolkit.googleapis.com/v1/projects',
      { method: 'HEAD', mode: 'no-cors' }
    );
    results.identityToolkit = true;
  } catch (error) {
    console.error('[Network] Failed to connect to identitytoolkit.googleapis.com:', error);
  }

  try {
    // Check Firestore connectivity
    const firestoreResponse = await fetch(
      'https://firestore.googleapis.com/v1/projects',
      { method: 'HEAD', mode: 'no-cors' }
    );
    results.firestore = true;
  } catch (error) {
    console.error('[Network] Failed to connect to firestore.googleapis.com:', error);
  }

  return results;
};

export const diagnoseNetworkIssues = async (): Promise<string[]> => {
  const issues: string[] = [];
  const connectivity = await checkFirebaseConnectivity();

  if (!connectivity.apisGoogle) {
    issues.push(
      'Cannot reach apis.google.com - This may indicate DNS hijacking by your ISP. ' +
      'Try changing your DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare).'
    );
  }

  if (!connectivity.identityToolkit) {
    issues.push(
      'Cannot reach identitytoolkit.googleapis.com - Firebase Authentication may not work. ' +
      'Check your DNS settings and firewall.'
    );
  }

  if (!connectivity.firestore) {
    issues.push(
      'Cannot reach firestore.googleapis.com - Database operations may fail. ' +
      'Verify your network connectivity and DNS configuration.'
    );
  }

  if (issues.length === 0) {
    issues.push('All Firebase services are reachable. If you still experience issues, check your Firebase configuration.');
  }

  return issues;
};

export default { checkFirebaseConnectivity, diagnoseNetworkIssues };