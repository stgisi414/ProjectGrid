
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
  
      // Get the presentation to find the default slide's ID
      const presentation = await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/${presentationId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json());
      
      // First, delete the default slide if it exists
      if (presentation.slides && presentation.slides.length > 0) {
        const defaultSlideId = presentation.slides[0].objectId;
        const deleteResponse = await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/${presentationId}:batchUpdate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    deleteObject: {
                        objectId: defaultSlideId,
                    },
                }]
            }),
        });
        if (!deleteResponse.ok) {
            console.warn('Failed to delete default slide, continuing...');
        }
      }

      // Create slides one by one to avoid conflicts
      const slides = [
        { type: 'TITLE_SLIDE', title: content.title, subtitle: content.subtitle },
        { type: 'TITLE_AND_BODY', title: content.problem.title, body: content.problem.content },
        { type: 'TITLE_AND_BODY', title: content.solution.title, body: content.solution.content },
        { type: 'TITLE_AND_BODY', title: content.targetMarket.title, body: content.targetMarket.content },
        { type: 'TITLE_AND_BODY', title: content.team.title, body: content.team.content }
      ];

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideId = `slide_${i}`;
        
        // Create slide
        const createSlideRequest = {
          requests: [{
            createSlide: {
              objectId: slideId,
              slideLayoutReference: { predefinedLayout: slide.type }
            }
          }]
        };

        const createSlideResponse = await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/${presentationId}:batchUpdate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(createSlideRequest),
        });

        if (!createSlideResponse.ok) {
          console.warn(`Failed to create slide ${i}, skipping...`);
          continue;
        }

        // Add text to slide
        const textRequests = [];
        if (slide.type === 'TITLE_SLIDE') {
          textRequests.push({
            insertText: {
              objectId: slideId,
              text: slide.title,
              insertionIndex: 0
            }
          });
        } else {
          textRequests.push({
            insertText: {
              objectId: slideId,
              text: `${slide.title}\n\n${slide.body}`,
              insertionIndex: 0
            }
          });
        }

        if (textRequests.length > 0) {
          await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/${presentationId}:batchUpdate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: textRequests }),
          });
        }
      }
  
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
