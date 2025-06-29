import { User } from '../types';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/**
 * A boolean flag indicating whether the Google Sign-In functionality is configured and available.
 * The UI can use this to conditionally show or hide sign-in buttons.
 */
export const isAuthAvailable = !!CLIENT_ID;

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive', // For creating folders, docs, sheets, slides
  'https://www.googleapis.com/auth/calendar.events', // For creating calendar events
].join(' ');

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

export const initTokenClient = (callback: (tokenResponse: google.accounts.oauth2.TokenResponse) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    // This check is a safeguard. The App component should prevent this function
    // from being called if isAuthAvailable is false.
    if (!CLIENT_ID) {
      return reject(new Error("GOOGLE_CLIENT_ID environment variable not set. Please set it up in your environment to use Google Sign-In."));
    }

    try {
      if (window.google?.accounts?.oauth2) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: callback,
          error_callback: (error) => {
            console.error("GSI Error:", error);
            // Propagate the error so the main app can handle it.
            reject(new Error("An error occurred during Google Sign-In."));
          },
          ux_mode: 'popup'
        });
        resolve();
      } else {
        reject(new Error("Google Identity Services library not loaded."));
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const requestAccessToken = () => {
  if (tokenClient) {
    // Prompt for user consent to get a new token.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    console.error("Token client not initialized. Cannot request access token.");
    // This case should be handled by the UI, which shouldn't show the sign-in
    // button if initialization failed or was not possible.
  }
};

export const revokeAccessToken = (accessToken: string) => {
    if (accessToken && window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke(accessToken, () => {
            console.log('Access token revoked.');
        });
    }
};

export const getUserInfo = async (accessToken: string): Promise<User> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    const errorBody = await response.json();
    console.error('Failed to fetch user info:', errorBody);
    throw new Error('Failed to fetch user info. The access token may be invalid or expired.');
  }
  const data = await response.json();
  return {
    name: data.name,
    email: data.email,
    picture: data.picture,
  };
};
