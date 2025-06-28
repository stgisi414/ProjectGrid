
import React, { useState, useEffect } from 'react';

const loadingSteps = [
  "Analyzing project description...",
  "Designing a unique logo...",
  "Structuring Google Drive folder...",
  "Drafting project proposal...",
  "Building project timeline...",
  "Assembling your pitch deck...",
  "Finalizing your workspace...",
];

export const LoadingSpinner: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % loadingSteps.length);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[300px] text-center">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-lg font-medium text-gray-300 animate-pulse">
        {loadingSteps[currentStep]}
      </p>
    </div>
  );
};
