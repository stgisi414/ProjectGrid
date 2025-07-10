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

    let jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("AI response text is empty or undefined.");
    }
    
    // Clean the JSON string
    const startIndex = jsonStr.indexOf('{');
    const endIndex = jsonStr.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) {
        throw new Error("Invalid JSON response from AI.");
    }
    jsonStr = jsonStr.substring(startIndex, endIndex + 1);

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

export const generateProjectIdeas = async (): Promise<Array<{title: string, description: string}>> => {
  if (!ai) {
    // Fallback ideas when API key is not set
    return [
      { title: "AI Fitness Tracker", description: "A mobile app that uses AI to analyze workout forms and provide personalized fitness recommendations based on user goals and progress." },
      { title: "Smart Recipe Generator", description: "An intelligent cooking assistant that generates personalized recipes based on dietary restrictions, available ingredients, and nutritional goals." },
      { title: "Eco-Friendly Marketplace", description: "An online platform connecting consumers with sustainable, locally-sourced products while tracking their environmental impact." },
      { title: "Virtual Study Buddy", description: "An AI-powered study companion that creates personalized learning schedules, quizzes, and collaborative study sessions for students." },
      { title: "Community Garden Network", description: "A social platform for organizing and managing community gardens, sharing gardening tips, and coordinating harvest distributions." }
    ];
  }

  const prompt = `
    Generate 5 diverse and innovative project ideas for modern businesses or applications. 
    Each idea should be unique and span different industries/categories like technology, sustainability, health, education, entertainment, finance, social impact, etc.
    
    Provide your response as a single, minified JSON array with no markdown.
    Each object should have exactly these keys:
    - "title": A catchy, concise name for the project (3-5 words max)
    - "description": A detailed 1-2 sentence description that explains what the project does and its value proposition
    
    Make the ideas practical but innovative, appealing to modern entrepreneurs and developers.
  `;

  try {
    const response = await ai.models.generateContent({
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

    let jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("AI response text is empty or undefined.");
    }
    
    // Clean the JSON string
    const startIndex = jsonStr.indexOf('[');
    const endIndex = jsonStr.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1) {
        throw new Error("Invalid JSON response from AI.");
    }
    jsonStr = jsonStr.substring(startIndex, endIndex + 1);

    const parsedData = JSON.parse(jsonStr);
    
    if (Array.isArray(parsedData) && parsedData.length > 0) {
       return parsedData;
    } else {
        throw new Error("AI response is not a valid array.");
    }

  } catch (error) {
    console.error("Failed to generate project ideas:", error);
    // Return fallback ideas on error
    return [
      { title: "AI Fitness Tracker", description: "A mobile app that uses AI to analyze workout forms and provide personalized fitness recommendations based on user goals and progress." },
      { title: "Smart Recipe Generator", description: "An intelligent cooking assistant that generates personalized recipes based on dietary restrictions, available ingredients, and nutritional goals." },
      { title: "Eco-Friendly Marketplace", description: "An online platform connecting consumers with sustainable, locally-sourced products while tracking their environmental impact." },
      { title: "Virtual Study Buddy", description: "An AI-powered study companion that creates personalized learning schedules, quizzes, and collaborative study sessions for students." },
      { title: "Community Garden Network", description: "A social platform for organizing and managing community gardens, sharing gardening tips, and coordinating harvest distributions." }
    ];
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