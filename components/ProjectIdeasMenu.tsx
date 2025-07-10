
import React, { useState, useEffect } from 'react';
import { generateProjectIdeas } from '../services/geminiService';

interface ProjectIdeasMenuProps {
  onSelectIdea: (idea: string) => void;
  isVisible: boolean;
}

interface ProjectIdea {
  title: string;
  description: string;
}

export const ProjectIdeasMenu: React.FC<ProjectIdeasMenuProps> = ({ onSelectIdea, isVisible }) => {
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && ideas.length === 0) {
      loadProjectIdeas();
    }
  }, [isVisible]);

  const loadProjectIdeas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedIdeas = await generateProjectIdeas();
      setIdeas(generatedIdeas);
    } catch (err) {
      console.error('Failed to load project ideas:', err);
      setError('Failed to load project ideas');
      // Fallback ideas
      setIdeas([
        { title: "AI Fitness Tracker", description: "A mobile app that uses AI to analyze workout forms and provide personalized fitness recommendations based on user goals and progress." },
        { title: "Smart Recipe Generator", description: "An intelligent cooking assistant that generates personalized recipes based on dietary restrictions, available ingredients, and nutritional goals." },
        { title: "Eco-Friendly Marketplace", description: "An online platform connecting consumers with sustainable, locally-sourced products while tracking their environmental impact." },
        { title: "Virtual Study Buddy", description: "An AI-powered study companion that creates personalized learning schedules, quizzes, and collaborative study sessions for students." },
        { title: "Community Garden Network", description: "A social platform for organizing and managing community gardens, sharing gardening tips, and coordinating harvest distributions." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdeaClick = (idea: ProjectIdea) => {
    onSelectIdea(idea.description);
  };

  if (!isVisible) return null;

  return (
    <div className={`transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 max-h-96 mt-4' : 'opacity-0 max-h-0'} overflow-hidden`}>
      <div className="bg-gray-800/70 rounded-lg border border-gray-600 p-4">
        <h3 className="text-lg font-medium text-gray-300 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Project Ideas
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-gray-400">Loading ideas...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-4">{error}</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ideas.map((idea, index) => (
              <button
                key={index}
                onClick={() => handleIdeaClick(idea)}
                className="w-full text-left p-3 rounded-lg bg-gray-900/50 hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-purple-400/50 group"
              >
                <h4 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                  {idea.title}
                </h4>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {idea.description}
                </p>
              </button>
            ))}
          </div>
        )}
        
        <button
          onClick={loadProjectIdeas}
          disabled={isLoading}
          className="mt-3 w-full text-center text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Get New Ideas'}
        </button>
      </div>
    </div>
  );
};
