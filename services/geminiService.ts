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
    You are a world-class business consultant, project manager, and brand strategist with expertise in creating comprehensive, professional business documents. Based on the following project description, generate a complete set of branded, detailed documents that would impress investors, stakeholders, and team members.

    CRITICAL: Include proper branding throughout ALL content. Add the project logo placeholder "[PROJECT_LOGO]" and company branding elements where appropriate in all documents.

    Provide your response as a single, minified JSON object with no markdown.
    The JSON object MUST have these keys with rich, detailed, professional content:

    - "projectName": A memorable, brandable company/project name (2-4 words max)
    - "projectObjective": A compelling one-sentence mission statement that captures the essence and impact
    - "brandIdentity": A comprehensive brand personality description including values, tone, target audience, and positioning (4-6 sentences)
    - "colorTheme": A hex code that perfectly represents the brand and industry
    - "kickoffMeetingTitle": An engaging, professional meeting title that builds excitement
    - "projectProposal": A comprehensive 6-paragraph proposal with: Executive Summary, Problem Statement, Proposed Solution, Scope of Work, Timeline & Milestones, and Expected Outcomes. Include [PROJECT_LOGO] at the top.
    - "projectPlan": A detailed 2D array with columns ["Phase/Task", "Start Date", "End Date", "Owner", "Priority", "Status"] and at least 12 comprehensive tasks covering all project phases
    - "budgetTracker": A detailed 2D array with columns ["Category", "Item", "Estimated Cost", "Actual Cost", "Variance", "Notes"] and at least 10 realistic budget items
    - "pitchDeck": A comprehensive pitch deck object with: "title", "subtitle", "brandingStatement" (include [PROJECT_LOGO]), "problem": {"title", "content" (3-4 sentences)}, "solution": {"title", "content" (3-4 sentences)}, "marketOpportunity": {"title", "content" (market size, trends)}, "businessModel": {"title", "content" (revenue streams)}, "targetMarket": {"title", "content" (detailed customer segments)}, "competitiveAdvantage": {"title", "content"}, "team": {"title", "content" (key roles needed)}, "financialProjections": {"title", "content"}, "fundingRequest": {"title", "content"}, "nextSteps": {"title", "content"}
    - "feedbackForm": A comprehensive feedback form with introduction text (include [PROJECT_LOGO]), at least 8 detailed questions covering all aspects: overall satisfaction, specific features, usability, value proposition, recommendations, areas for improvement, likelihood to recommend, and additional comments
    - "projectChecklist": A detailed checklist with [PROJECT_LOGO] header and at least 15 actionable items organized by phases: Planning (5 items), Development (5 items), Testing (3 items), Launch (2 items)

    Make everything professional, detailed, and industry-appropriate. Use realistic dates, costs, and technical details.

    Project Description: "${description}"
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
      model: "gemini-2.5-flash",
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
            model: 'imagen-3.0-fast-generate-001',
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