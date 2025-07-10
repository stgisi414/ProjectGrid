
import { PitchDeckContent } from '../types';

const GOOGLE_DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3';
const GOOGLE_SHEETS_API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_SLIDES_API_BASE_URL = 'https://slides.googleapis.com/v1';

export const createGoogleDriveFolder = async (folderName: string, accessToken: string): Promise<{ folderId: string, folderUrl: string }> => {
  try {
    console.log('Creating Google Drive folder:', folderName);
    const response = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
    });
    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Google Drive API error:', errorBody);
      throw new Error(`Failed to create Google Drive folder: ${errorBody.error?.message || 'Unknown error'}`);
    }
    const data = await response.json();
    console.log('Successfully created folder:', data.id);
    return { folderId: data.id, folderUrl: data.webViewLink };
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    throw error;
  }
};

export const createGoogleDoc = async (title: string, parentId: string, accessToken: string, content?: string): Promise<{ url: string }> => {
  try {
    console.log('Creating Google Doc:', title);
    const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: title, mimeType: 'application/vnd.google-apps.document', parents: [parentId] }),
    });
    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      console.error('Google Docs API error:', errorBody);
      throw new Error(`Failed to create Google Doc: ${errorBody.error?.message || 'Unknown error'}`);
    }
    const file = await createResponse.json();
    if (content) {
      const contentResponse = await fetch(`https://docs.googleapis.com/v1/documents/${file.id}:batchUpdate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: content } }] }),
      });
      if (!contentResponse.ok) {
        console.error('Failed to add content to Google Doc');
      }
    }
    console.log('Successfully created Google Doc:', file.id);
    return { url: file.webViewLink };
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
};

export const createGoogleSheet = async (title: string, parentId: string, accessToken: string, values?: string[][]): Promise<{ url: string }> => {
  try {
    console.log('Creating Google Sheet:', title);
    const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: title, mimeType: 'application/vnd.google-apps.spreadsheet', parents: [parentId] }),
    });
    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      console.error('Google Sheets API error:', errorBody);
      throw new Error(`Failed to create Google Sheet: ${errorBody.error?.message || 'Unknown error'}`);
    }
    const file = await createResponse.json();
    if (values) {
      const valuesResponse = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}/${file.id}/values/A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      });
      if (!valuesResponse.ok) {
        console.error('Failed to add values to Google Sheet');
      }
    }
    console.log('Successfully created Google Sheet:', file.id);
    return { url: file.webViewLink };
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
};

export const createGoogleSlide = async (title: string, parentId: string, accessToken: string, content: PitchDeckContent): Promise<{ url: string }> => {
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
  
      // First, get the presentation to find existing slides
      const presentationResponse = await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/presentations/${presentationId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!presentationResponse.ok) {
        throw new Error('Failed to get presentation details');
      }

      const presentation = await presentationResponse.json();
      const slideId = presentation.slides[0].objectId; // Use the first slide

      // Create requests to update the existing slide
      const requests = [
        {
          insertText: {
            objectId: slideId,
            text: `${content.title}\n\n${content.subtitle}`,
            insertionIndex: 0
          }
        }
      ];
  
      await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/presentations/${presentationId}:batchUpdate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
      });
  
      return { url: file.webViewLink };
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
): Promise<{ url: string }> => {
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
    return { url: data.htmlLink };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return { url: '#' };
  }
};
