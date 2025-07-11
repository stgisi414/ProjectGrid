import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { ProjectDetails, GeneratedAsset, AssetType, User } from './types';
import { generateProjectDetails, generateLogo } from './services/geminiService';
import * as FirebaseAuth from './services/firebaseAuthService';
import { createGoogleDriveFolder, createGoogleDoc, createGoogleSheet, createGoogleSlide, createGoogleCalendarEvent } from './services/googleWorkspaceService';
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

  const handleSignOut = useCallback(async () => {
    try {
      await FirebaseAuth.signOutUser();
      setAccessToken(null);
      setUser(null);
      resetStateForNewProject();
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (FirebaseAuth.isAuthAvailable) {
      const unsubscribe = FirebaseAuth.onAuthStateChange((firebaseUser) => {
        if (firebaseUser) {
          const user: User = {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            picture: firebaseUser.photoURL || '',
          };
          setUser(user);
          // Note: Access token needs to be obtained when signing in
        } else {
          setUser(null);
          setAccessToken(null);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const handleSignIn = async () => {
    try {
      const { user, accessToken } = await FirebaseAuth.signInWithGoogle();
      setUser(user);
      setAccessToken(accessToken);
      setError(null);
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Failed to sign in. Please try again.');
    }
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
      const details: ProjectDetails = await generateProjectDetails(projectDescription);
      setColorTheme(details.colorTheme);

      let finalLogoUrl: string;
      if (logoFile) {
        finalLogoUrl = URL.createObjectURL(logoFile);
      } else {
        finalLogoUrl = await generateLogo(details.projectName, details.projectObjective);
      }
      setGeneratedLogoUrl(finalLogoUrl);

      if (isSignedIn && accessToken) {
        const assets: GeneratedAsset[] = [];

        try {
          const { folderId, folderUrl } = await createGoogleDriveFolder(details.projectName, accessToken);
          assets.push({ type: AssetType.Drive, name: `${details.projectName} - Project Folder`, icon: <GoogleDriveIcon />, url: folderUrl });

          const assetCreationPromises = [
            createGoogleDoc('Project Plan & Timeline', folderId, accessToken, 
              typeof details.projectPlan === 'string' ? details.projectPlan : 
              details.projectPlan.map(row => row.join(' | ')).join('\n'))
              .then(({ url }) => ({ type: AssetType.Docs, name: 'Project Plan & Timeline', icon: <GoogleDocsIcon />, url }))
              .catch(error => {
                console.error('Failed to create Project Plan:', error);
                return { type: AssetType.Docs, name: 'Project Plan & Timeline', icon: <GoogleDocsIcon />, url: '#' };
              }),

            createGoogleDoc('Project Proposal', folderId, accessToken, details.projectProposal)
              .then(({ url }) => ({ type: AssetType.Docs, name: 'Project Proposal', icon: <GoogleDocsIcon />, url }))
              .catch(error => {
                console.error('Failed to create Project Proposal:', error);
                return { type: AssetType.Docs, name: 'Project Proposal', icon: <GoogleDocsIcon />, url: '#' };
              }),

            createGoogleSheet('Budget Tracker', folderId, accessToken, details.budgetTracker)
              .then(({ url }) => ({ type: AssetType.Sheets, name: 'Budget Tracker', icon: <GoogleSheetsIcon />, url }))
              .catch(error => {
                console.error('Failed to create Budget Tracker:', error);
                return { type: AssetType.Sheets, name: 'Budget Tracker', icon: <GoogleSheetsIcon />, url: '#' };
              }),

            createGoogleSlide('Pitch Deck', folderId, accessToken, details.pitchDeck)
              .then(({ url }) => ({ type: AssetType.Slides, name: 'Pitch Deck', icon: <GoogleSlidesIcon />, url }))
              .catch(error => {
                console.error('Failed to create Pitch Deck:', error);
                return { type: AssetType.Slides, name: 'Pitch Deck', icon: <GoogleSlidesIcon />, url: '#' };
              }),

            createGoogleDoc('Stakeholder Feedback Form', folderId, accessToken, details.feedbackForm)
              .then(({ url }) => ({ type: AssetType.Forms, name: 'Stakeholder Feedback Form', icon: <GoogleFormsIcon />, url }))
              .catch(error => {
                console.error('Failed to create Feedback Form:', error);
                return { type: AssetType.Forms, name: 'Stakeholder Feedback Form', icon: <GoogleFormsIcon />, url: '#' };
              }),

            createGoogleDoc('Project Checklist', folderId, accessToken, details.projectChecklist)
              .then(({ url }) => ({ type: AssetType.Keep, name: 'Project Checklist', icon: <GoogleKeepIcon />, url }))
              .catch(error => {
                console.error('Failed to create Project Checklist:', error);
                return { type: AssetType.Keep, name: 'Project Checklist', icon: <GoogleKeepIcon />, url: '#' };
              })
          ];

          const createdAssets = await Promise.all(assetCreationPromises);
          assets.push(...createdAssets);
        } catch (error) {
          console.error('Failed to create Google Drive folder:', error);
          // Add placeholder assets if folder creation fails
          assets.push(
            { type: AssetType.Drive, name: `${details.projectName} - Project Folder`, icon: <GoogleDriveIcon />, url: '#' },
            { type: AssetType.Docs, name: 'Project Plan & Timeline', icon: <GoogleDocsIcon />, url: '#' },
            { type: AssetType.Docs, name: 'Project Proposal', icon: <GoogleDocsIcon />, url: '#' },
            { type: AssetType.Sheets, name: 'Budget Tracker', icon: <GoogleSheetsIcon />, url: '#' },
            { type: AssetType.Slides, name: 'Pitch Deck', icon: <GoogleSlidesIcon />, url: '#' },
            { type: AssetType.Forms, name: 'Stakeholder Feedback Form', icon: <GoogleFormsIcon />, url: '#' },
            { type: AssetType.Keep, name: 'Project Checklist', icon: <GoogleKeepIcon />, url: '#' }
          );
        }

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const kickoffDate = tomorrow.toISOString().split('T')[0];
        const kickoffTime = '09:00:00';
        const kickoffDateTime = `${kickoffDate}T${kickoffTime}`;
        const { url: kickoffEventUrl } = await createGoogleCalendarEvent(
          `${details.kickoffMeetingTitle}`,
          `Kick-off meeting for ${details.projectName}`,
          kickoffDateTime,
          kickoffDateTime,
          accessToken
        );
        assets.push({ type: AssetType.Calendar, name: `${details.kickoffMeetingTitle} on ${kickoffDate}`, icon: <GoogleCalendarIcon />, url: kickoffEventUrl });

        setGeneratedAssets(assets);
      }
    } catch (e) {
      console.error(e);
      let errorMessage = 'An unknown error occurred during asset generation.';
      if (e instanceof Error) {
        errorMessage = e.message.includes('403') 
          ? `An API permission is missing. Please ensure all required APIs are enabled in your Google Cloud project.`
          : e.message;
      }
      setError(errorMessage);
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
          <p>Describe your project, and we&apos;ll instantly generate a branded workspace in Google Drive.</p>
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
              isAuthAvailable={FirebaseAuth.isAuthAvailable}
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