
import type { ReactNode } from 'react';

export enum AssetType {
  Drive = 'Google Drive',
  Docs = 'Google Docs',
  Sheets = 'Google Sheets',
  Slides = 'Google Slides',
  Calendar = 'Google Calendar',
  Forms = 'Google Forms',
  Keep = 'Google Keep',
  Chat = 'Google Chat',
  Logo = 'Logo'
}

export interface GeneratedAsset {
  type: AssetType;
  name: string;
  icon: ReactNode;
  url: string;
}

export interface ProjectDetails {
  projectName: string;
  projectObjective: string;
  colorTheme: string;
  kickoffMeetingTitle: string;
}

export interface User {
  name: string;
  email: string;
  picture: string;
}

// Add this to make the Google Identity Services library available on the window object
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: google.accounts.oauth2.TokenClientConfig) => google.accounts.oauth2.TokenClient;
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
  namespace google.accounts.oauth2 {
      interface TokenClient {
        requestAccessToken: (overrideConfig?: Record<string, unknown>) => void;
      }
      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (tokenResponse: TokenResponse) => void;
        error_callback?: (error: unknown) => void;
      }
      interface TokenResponse {
        access_token: string;
        // ... other properties
      }
  }
}
