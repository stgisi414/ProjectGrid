
const GOOGLE_DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3';

export const createGoogleDriveFolder = async (folderName: string, accessToken: string): Promise<{ folderId: string, folderUrl: string }> => {
  try {
    const response = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Failed to create Google Drive folder:', errorBody);
      throw new Error(`Failed to create Google Drive folder: ${errorBody.error.message}`);
    }

    const data = await response.json();
    return { folderId: data.id, folderUrl: data.webViewLink };
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    throw error;
  }
};

export const createGoogleDoc = async (title: string, parentId: string, accessToken: string): Promise<string> => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.document',
        parents: [parentId],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Failed to create Google Doc:', errorBody);
      throw new Error(`Failed to create Google Doc: ${errorBody.error.message}`);
    }

    const data = await response.json();
    return data.webViewLink;
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
};

export const createGoogleSheet = async (title: string, parentId: string, accessToken: string): Promise<string> => {
  try {
    const response = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [parentId],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Failed to create Google Sheet:', errorBody);
      throw new Error(`Failed to create Google Sheet: ${errorBody.error.message}`);
    }

    const data = await response.json();
    return data.webViewLink;
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
};

export const createGoogleSlide = async (title: string, parentId: string, accessToken: string): Promise<string> => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.presentation',
        parents: [parentId],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Failed to create Google Slide:', errorBody);
      throw new Error(`Failed to create Google Slide: ${errorBody.error.message}`);
    }

    const data = await response.json();
    return data.webViewLink;
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
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: summary,
        description: description,
        start: {
          dateTime: startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use local timezone
        },
        end: {
          dateTime: endTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use local timezone
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Failed to create Google Calendar event:', errorBody);
      throw new Error(`Failed to create Google Calendar event: ${errorBody.error.message}`);
    }

    const data = await response.json();
    return data.htmlLink;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return '#'; // Return a placeholder URL on error
  }
};


