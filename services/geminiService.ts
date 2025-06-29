
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProjectDetails } from '../types';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateProjectDetails = async (description: string): Promise<ProjectDetails> => {
  if (!ai) {
    // Provide a fallback object when API key is not set
    return {
        projectName: "My Test Project",
        projectObjective: "A test project to showcase functionality.",
        brandIdentity: "A friendly and approachable brand.",
        colorTheme: "#4285F4",
        kickoffMeetingTitle: "Test Project Kick-off",
        projectProposal: "This is a sample project proposal.",
        projectPlan: [["Task 1", "2025-01-01", "2025-01-05", "Admin"]],
        budgetTracker: [["Expense", "Amount"], ["Initial Server Costs", "500"]],
        pitchDeck: {
            title: "Test Project Pitch",
            subtitle: "Revolutionizing the test project industry.",
            problem: { title: "The Problem", content: "Test projects are too boring." },
            solution: { title: "Our Solution", content: "We make them exciting!" },
            targetMarket: { title: "Target Market", content: "Everyone who needs a test project." },
            team: { title: "Our Team", content: "A dedicated team of test project enthusiasts." }
        },
        feedbackForm: "What did you like most? What could be improved?",
        projectChecklist: "1. Complete setup. 2. Deploy. 3. Celebrate."
    };
  }

  const prompt = `
    You are a world-class business consultant and project manager. Based on the following project description, generate a comprehensive set of branded documents.
    Provide your response as a single, minified JSON object with no markdown.
    The JSON object MUST have these keys, with detailed, well-structured content for each:
    - "projectName": A short, catchy name for the project.
    - "projectObjective": A one-sentence summary of the project's goal.
    - "brandIdentity": A brief description of the brand's personality and values.
    - "colorTheme": A hex code for a primary color that fits the project's theme.
    - "kickoffMeetingTitle": A title for a calendar event for the project kick-off.
    - "projectProposal": A 3-paragraph project proposal including an introduction, a "Scope of Work" section, and a "Timeline" section.
    - "projectPlan": A 2D array of strings for a project plan with columns: "Task", "Start Date", "End Date", "Owner", and at least 5 tasks.
    - "budgetTracker": A 2D array of strings for a budget with columns: "Item", "Category", "Cost", and at least 5 budget items.
    - "pitchDeck": A JSON object with content for a 6-slide pitch deck. It must have keys: "title", "subtitle", "problem": {"title", "content"}, "solution": {"title", "content"}, "targetMarket": {"title", "content"}, "team": {"title", "content"}.
    - "feedbackForm": A string containing at least 3 open-ended questions for a stakeholder feedback form.
    - "projectChecklist": A string containing a numbered list of at least 5 key tasks for a project checklist.

    Project Description: "${description}"
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json",
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("AI response text is empty or undefined.");
    }
    
    const parsedData = JSON.parse(jsonStr);
    
    // Add more robust validation here based on the new structure
    if (parsedData.projectName && parsedData.pitchDeck && parsedData.projectPlan) {
       return parsedData as ProjectDetails;
    } else {
        throw new Error("AI response is missing required fields.");
    }

  } catch (error) {
    console.error("Failed to generate project details:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate project details from AI: ${error.message}`);
    }
    throw new Error("Failed to generate project details from AI. Please try again.");
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
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const image = response.generatedImages[0].image;
            if (!image || !image.imageBytes) {
                throw new Error("Image or image bytes are undefined.");
            }
            const base64ImageBytes = image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Failed to generate logo:", error);
        throw new Error("Could not generate a logo. Please try again.");
    }
};
