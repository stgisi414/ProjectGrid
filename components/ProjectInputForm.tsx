
import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface ProjectInputFormProps {
  projectDescription: string;
  setProjectDescription: (value: string) => void;
  setLogoFile: (file: File | null) => void;
  onGenerate: () => void;
  error: string | null;
  logoFile: File | null;
  isSignedIn: boolean;
  isAuthAvailable: boolean;
  onSignIn: () => void;
}

export const ProjectInputForm: React.FC<ProjectInputFormProps> = ({
  projectDescription,
  setProjectDescription,
  setLogoFile,
  onGenerate,
  error,
  logoFile,
  isSignedIn,
  isAuthAvailable,
  onSignIn,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <label htmlFor="project-description" className="block text-lg font-medium text-gray-300 mb-2">
          What project, company, or task do you want to build?
        </label>
        <textarea
          id="project-description"
          rows={6}
          className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
          placeholder="e.g., An AI-powered mobile app for personal finance that helps users track spending and save money..."
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <label htmlFor="logo-upload" className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-700/50 transition-colors">
          <LogoIcon />
          <span className="ml-3 text-gray-400">{logoFile ? logoFile.name : 'Upload a logo (optional)'}</span>
          <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
        </label>
        <p className="text-gray-500 text-sm sm:ml-4">If no logo is provided, we&apos;ll generate one for you.</p>
      </div>
      
      {error && (
        <p className="text-center text-red-400">
          {error}
        </p>
      )}

      <div className="pt-4 space-y-4">
        {isAuthAvailable && !isSignedIn && (
          <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-800/50">
              <p className="mb-3 font-medium text-blue-200">Want a full workspace?</p>
              <button
                  onClick={onSignIn}
                  type="button"
                  className="bg-white text-gray-800 font-semibold py-2 px-6 rounded-lg flex items-center justify-center mx-auto hover:bg-gray-200 transition-colors shadow-md"
                  aria-label="Sign in with Google"
              >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,35.816,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                  Sign in with Google
              </button>
              <p className="mt-3 text-sm text-blue-300/70">Sign in to automatically create a full set of branded documents in your Google Drive.</p>
          </div>
        )}
        <button
          onClick={onGenerate}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300 transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Generate Project Grid
        </button>
      </div>
    </div>
  );
};
