
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProjectDetails } from '../types';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateProjectDetails = async (description: string): Promise<ProjectDetails> => {
  if (!ai) {
    // Provide a fallback object when API key is not set
    return {
      projectName: "My New Project",
      projectObjective: "To complete all project goals on time.",
      colorTheme: "#4A90E2",
      kickoffMeetingTitle: "Project Kick-off"
    };
  }

  const prompt = `
    You are a project management assistant. Based on the following project description, extract key details.
    Provide your response as a single, minified JSON object with no markdown.
    The JSON object MUST have these keys:
    - "projectName": A short, catchy name for the project.
    - "projectObjective": A one-sentence summary of the project's goal.
    - "colorTheme": A hex code for a primary color that fits the project's theme (e.g., "#4285F4").
    - "kickoffMeetingTitle": A title for a calendar event for the project kick-off.

    Project Description: "${description}"
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);
    
    // Basic validation
    if (parsedData.projectName && parsedData.projectObjective && parsedData.colorTheme && parsedData.kickoffMeetingTitle) {
       return parsedData as ProjectDetails;
    } else {
        throw new Error("AI response is missing required fields.");
    }

  } catch (error) {
    console.error("Failed to generate project details:", error);
    // Provide a fallback object in case of API error
    return {
      projectName: "My New Project",
      projectObjective: "To complete all project goals on time.",
      colorTheme: "#4A90E2",
      kickoffMeetingTitle: "Project Kick-off"
    };
  }
};

export const generateLogo = async (projectName: string, projectObjective: string): Promise<string> => {
    if (!ai) {
        throw new Error("GEMINI_API_KEY environment variable not set. Please set it up to generate logos.");
    }

    const prompt = `A minimalist, modern, abstract logo for a company called "${projectName}". The logo should visually represent the concept of "${projectObjective}". It should be simple, iconic, and work well in a square format. Use a vibrant color palette.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Failed to generate logo:", error);
        throw new Error("Could not generate a logo. Please try again.");
    }
};
