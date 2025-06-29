
import { PitchDeckContent } from '../types';

const GOOGLE_DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3';
const GOOGLE_SHEETS_API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_SLIDES_API_BASE_URL = 'https://slides.googleapis.com/v1/presentations';

export const createGoogleDriveFolder = async (folderName: string, accessToken: string): Promise<{ folderId: string, folderUrl: string }> => {
  try {
    const response = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
    });
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Failed to create Google Drive folder: ${errorBody.error.message}`);
    }
    const data = await response.json();
    return { folderId: data.id, folderUrl: data.webViewLink };
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    throw error;
  }
};

export const createGoogleDoc = async (title: string, parentId: string, accessToken: string, content?: string): Promise<string> => {
  try {
    const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: title, mimeType: 'application/vnd.google-apps.document', parents: [parentId] }),
    });
    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      throw new Error(`Failed to create Google Doc: ${errorBody.error.message}`);
    }
    const file = await createResponse.json();
    if (content) {
      await fetch(`https://docs.googleapis.com/v1/documents/${file.id}:batchUpdate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: content } }] }),
      });
    }
    return file.webViewLink;
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
};

export const createGoogleSheet = async (title: string, parentId: string, accessToken: string, values?: string[][]): Promise<string> => {
  try {
    const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: title, mimeType: 'application/vnd.google-apps.spreadsheet', parents: [parentId] }),
    });
    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      throw new Error(`Failed to create Google Sheet: ${errorBody.error.message}`);
    }
    const file = await createResponse.json();
    if (values) {
      await fetch(`${GOOGLE_SHEETS_API_BASE_URL}/${file.id}/values/A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      });
    }
    return file.webViewLink;
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
};

export const createGoogleSlide = async (title: string, parentId: string, accessToken: string, content: PitchDeckContent): Promise<string> => {
    try {
      const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: title, mimeType: 'application/vnd.google-apps.presentation', parents: [parentId] }),
      });
      if (!createResponse.ok) {
          const errorBody = await createResponse.json();
          throw new Error(`Failed to create Google Slide: ${errorBody.error.message}`);
      }
      const file = await createResponse.json();
      const presentationId = file.id;
  
      const requests = [];
      
      // Get the presentation to find the default slide's ID
      const presentation = await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/${presentationId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json());
      
      if (presentation.slides && presentation.slides.length > 0) {
        const defaultSlideId = presentation.slides[0].objectId;
        requests.push({
            deleteObject: {
                objectId: defaultSlideId,
            },
        });
      }
  
      // Create Title Slide
      const titleSlideId = "title_slide_01";
      requests.push({
          createSlide: {
              objectId: titleSlideId,
              slideLayoutReference: { predefinedLayout: 'TITLE_SLIDE' },
              placeholderIdMappings: [
                  { layoutPlaceholder: { type: 'CENTERED_TITLE' }, objectId: "title_placeholder_01" },
                  { layoutPlaceholder: { type: 'SUBTITLE' }, objectId: "subtitle_placeholder_01" }
              ]
          }
      });
      requests.push({ insertText: { objectId: "title_placeholder_01", text: content.title } });
      requests.push({ insertText: { objectId: "subtitle_placeholder_01", text: content.subtitle } });
  
      // Create Content Slides
      const contentSlides = [content.problem, content.solution, content.targetMarket, content.team];
      contentSlides.forEach((slideContent, index) => {
          const slideId = `content_slide_${index}`;
          const titlePlaceholderId = `content_title_${index}`;
          const bodyPlaceholderId = `content_body_${index}`;
          requests.push({
              createSlide: {
                  objectId: slideId,
                  slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' },
                  placeholderIdMappings: [
                      { layoutPlaceholder: { type: 'TITLE' }, objectId: titlePlaceholderId },
                      { layoutPlaceholder: { type: 'BODY' }, objectId: bodyPlaceholderId }
                  ]
              }
          });
          requests.push({ insertText: { objectId: titlePlaceholderId, text: slideContent.title } });
          requests.push({ insertText: { objectId: bodyPlaceholderId, text: slideContent.content } });
      });
  
      await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/${presentationId}:batchUpdate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
      });
  
      return file.webViewLink;
    } catch (error) {
      console.error('Error creating Google Slide:', error);
      throw error;
    }
  };


export const createGoogleCalendarEvent = async (
  summary: string,
  description: string,
  startTime: string,
  endTime: string,
  accessToken: string
): Promise<string> => {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: endTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      }),
    });
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Failed to create Google Calendar event: ${errorBody.error.message}`);
    }
    const data = await response.json();
    return data.htmlLink;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return '#';
  }
};
