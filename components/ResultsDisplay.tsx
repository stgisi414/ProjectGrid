
import React from 'react';
import { GeneratedAsset } from '../types';

interface ResultsDisplayProps {
  assets: GeneratedAsset[];
  logoUrl: string | null;
  onStartNew: () => void;
  colorTheme: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ assets, logoUrl, onStartNew, colorTheme }) => {
  const hasFullGrid = assets.length > 0;

  const headerStyle = {
    '--theme-color-start': colorTheme,
    '--theme-color-end': '#a855f7', // A nice purple that pairs well with most colors
  } as React.CSSProperties;

  return (
    <div className="animate-fade-in space-y-8" style={{ '--theme-color': colorTheme } as React.CSSProperties}>
      <style>
        {`
          .themed-gradient-text {
            background: linear-gradient(to right, var(--theme-color-start), var(--theme-color-end));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
          }
          .asset-card:hover {
            border-color: var(--theme-color);
          }
          .asset-card:hover .asset-name {
            color: var(--theme-color);
          }
          a.asset-card {
            cursor: pointer;
          }
        `}
      </style>
      <div className="text-center">
        <h2 className="text-3xl font-bold themed-gradient-text" style={headerStyle}>
          {hasFullGrid ? "Your Project Grid is Ready!" : "Your Project Idea is Ready!"}
        </h2>
        <p className="mt-2 text-gray-400">
          {hasFullGrid
            ? "The following assets have been created for your project."
            : "Here is your generated logo and branding. Sign in and generate again to create a full workspace."
          }
        </p>
      </div>

      {/* Full Grid Layout */}
      {hasFullGrid && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {logoUrl && (
            <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center col-span-1 sm:col-span-1 lg:row-span-2 transition-colors duration-200">
              <h3 className="font-semibold text-gray-300 mb-3">Generated Logo</h3>
              <div className="p-1 rounded-full bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 shadow-lg">
                  <img src={logoUrl} alt="Generated Project Logo" className="w-32 h-32 object-cover" />
              </div>
            </div>
          )}
          {assets.map((asset, index) => {
            const isClickable = asset.url && asset.url !== '#';
            
            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (isClickable) {
                console.log('Opening URL:', asset.url);
                window.open(asset.url, '_blank', 'noopener,noreferrer');
              } else {
                console.log('Asset not clickable:', asset.name, asset.url);
              }
            };

            return (
              <div
                key={index}
                onClick={handleClick}
                className={`asset-card bg-gray-900/70 p-4 rounded-xl border border-gray-700 flex items-center space-x-4 hover:bg-gray-700/50 transition-all duration-200 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex-shrink-0 w-10 h-10">{asset.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-white asset-name transition-colors duration-200">{asset.name}</p>
                  <p className="text-sm text-gray-400">{asset.type}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Idea-Only Layout */}
      {!hasFullGrid && logoUrl && (
         <div className="bg-gray-900/70 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center transition-colors duration-200">
            <h3 className="font-semibold text-gray-300 mb-3">Generated Logo & Branding</h3>
            <div className="p-1 rounded-full bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 shadow-lg">
                <img src={logoUrl} alt="Generated Project Logo" className="w-40 h-40 object-cover" />
            </div>
            <p className="mt-4 text-lg text-gray-300">
                Your theme color is{' '}
                <span style={{ color: colorTheme, textShadow: `0 0 8px ${colorTheme}` }} className="font-bold tracking-wider">
                    {colorTheme}
                </span>
            </p>
         </div>
      )}

      <div className="pt-4 text-center">
        <button
          onClick={onStartNew}
          className="bg-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500/50"
        >
          Create Another Project
        </button>
      </div>
    </div>
  );
};
