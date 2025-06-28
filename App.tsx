
import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { ProjectDetails, GeneratedAsset, AssetType, User } from './types';
import { generateProjectDetails, generateLogo } from './services/geminiService';
import * as GoogleAuth from './services/googleAuthService';
import { ProjectInputForm } from './components/ProjectInputForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ResultsDisplay } from './components/ResultsDisplay';
import { GoogleDriveIcon } from './components/icons/GoogleDriveIcon';
import { GoogleDocsIcon } from './components/icons/GoogleDocsIcon';
import { GoogleSheetsIcon } from './components/icons/GoogleSheetsIcon';
import { GoogleSlidesIcon } from './components/icons/GoogleSlidesIcon';
import { GoogleCalendarIcon } from './components/icons/GoogleCalendarIcon';
import { GoogleFormsIcon } from './components/icons/GoogleFormsIcon';
import { GoogleKeepIcon } from './components/icons/GoogleKeepIcon';
import { GoogleChatIcon } from './components/icons/GoogleChatIcon';

const App: React.FC = () => {
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [generatedLogoUrl, setGeneratedLogoUrl] = useState<string | null>(null);
  const [colorTheme, setColorTheme] = useState<string>('#4A90E2');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const isSignedIn = !!accessToken;

  const resetStateForNewProject = () => {
    setProjectDescription('');
    setLogoFile(null);
    setGeneratedAssets([]);
    setGeneratedLogoUrl(null);
    setError(null);
    setColorTheme('#4A90E2');
  };

  const handleSignOut = useCallback(() => {
    if (accessToken) {
      GoogleAuth.revokeAccessToken(accessToken);
    }
    setAccessToken(null);
    setUser(null);
    resetStateForNewProject();
  }, [accessToken]);
  
  useEffect(() => {
    // Only attempt to initialize the Google Sign-In client if it's configured.
    if (GoogleAuth.isAuthAvailable) {
        const checkGsiLoaded = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
            clearInterval(checkGsiLoaded);
            GoogleAuth.initTokenClient(async (tokenResponse) => {
            setAccessToken(tokenResponse.access_token);
            try {
                const userInfo = await GoogleAuth.getUserInfo(tokenResponse.access_token);
                setUser(userInfo);
                setError(null); // Clear previous errors on successful sign-in
            } catch (error) {
                console.error(error);
                setError("Failed to fetch user profile.");
                setAccessToken(null);
                setUser(null);
            }
            }).catch(err => {
                console.error("Error initializing GSI client:", err);
                setError("Sign-in is temporarily unavailable. Please try again later.");
            });
        }
        }, 100);

        return () => clearInterval(checkGsiLoaded);
    }
  }, []);

  const handleSignIn = () => {
    GoogleAuth.requestAccessToken();
  };


  const handleGeneration = useCallback(async () => {
    if (!projectDescription.trim()) {
      setError('Please provide a project description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedAssets([]);
    setGeneratedLogoUrl(null);

    try {
      // Step 1: Generate project details from description (runs for everyone)
      const details: ProjectDetails = await generateProjectDetails(projectDescription);
      setColorTheme(details.colorTheme);

      // Step 2: Handle logo (runs for everyone)
      let finalLogoUrl: string;
      if (logoFile) {
        finalLogoUrl = URL.createObjectURL(logoFile);
      } else {
        finalLogoUrl = await generateLogo(details.projectName, details.projectObjective);
      }
      setGeneratedLogoUrl(finalLogoUrl);

      // Step 3: Conditionally create Google Workspace assets if signed in
      if (isSignedIn && accessToken) {
        // NOTE: This is where you would add actual Google Workspace API calls.
        // e.g., createGoogleDriveFolder(details.projectName, accessToken);
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const kickoffDate = tomorrow.toISOString().split('T')[0];

        const assets: GeneratedAsset[] = [
          { type: AssetType.Drive, name: `${details.projectName} - Project Folder`, icon: <GoogleDriveIcon />, url: '#' },
          { type: AssetType.Docs, name: 'Project Proposal', icon: <GoogleDocsIcon />, url: '#' },
          { type: AssetType.Docs, name: 'Meeting Notes Template', icon: <GoogleDocsIcon />, url: '#' },
          { type: AssetType.Sheets, name: 'Project Plan & Timeline', icon: <GoogleSheetsIcon />, url: '#' },
          { type: AssetType.Sheets, name: 'Budget Tracker', icon: <GoogleSheetsIcon />, url: '#' },
          { type: AssetType.Slides, name: 'Pitch Deck Template', icon: <GoogleSlidesIcon />, url: '#' },
          { type: AssetType.Calendar, name: `${details.kickoffMeetingTitle} on ${kickoffDate}`, icon: <GoogleCalendarIcon />, url: '#' },
          { type: AssetType.Calendar, name: 'Weekly Team Sync', icon: <GoogleCalendarIcon />, url: '#' },
          { type: AssetType.Forms, name: 'Stakeholder Feedback Form', icon: <GoogleFormsIcon />, url: '#' },
          { type: AssetType.Keep, name: 'Project Checklist', icon: <GoogleKeepIcon />, url: '#' },
          { type: AssetType.Chat, name: `${details.projectName} Team Space`, icon: <GoogleChatIcon />, url: '#' },
        ];
        setGeneratedAssets(assets);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [projectDescription, logoFile, isSignedIn, accessToken]);

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center my-8 relative">
           {isSignedIn && user && (
            <div className="absolute top-0 right-0 flex items-center space-x-3 bg-gray-800/50 p-2 rounded-full border border-gray-700">
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium text-gray-300 hidden sm:block">{user.name}</span>
              <button 
                onClick={handleSignOut} 
                className="text-sm text-gray-400 hover:text-white transition-colors pr-2"
                aria-label="Sign Out"
              >
                Sign Out
              </button>
            </div>
          )}
          <img src="/project_grid_logo.png" alt="Project Grid Logo" className="w-20 h-20 mx-auto mb-4 rounded-full" />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Project Grid
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Describe your project, and we'll instantly generate a branded workspace in Google Drive.
          </p>
        </header>

        <main className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700">
          {!isLoading && generatedAssets.length === 0 && generatedLogoUrl === null && (
            <ProjectInputForm
              projectDescription={projectDescription}
              setProjectDescription={setProjectDescription}
              setLogoFile={setLogoFile}
              onGenerate={handleGeneration}
              error={error}
              logoFile={logoFile}
              isSignedIn={isSignedIn}
              isAuthAvailable={GoogleAuth.isAuthAvailable}
              onSignIn={handleSignIn}
            />
          )}

          {isLoading && <LoadingSpinner />}

          {!isLoading && (generatedAssets.length > 0 || generatedLogoUrl) && (
            <ResultsDisplay 
              assets={generatedAssets} 
              logoUrl={generatedLogoUrl}
              onStartNew={resetStateForNewProject} 
              colorTheme={colorTheme}
            />
          )}
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Google Gemini & Imagen. All assets are placeholders.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
