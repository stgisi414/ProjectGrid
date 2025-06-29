
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

export const createGoogleDoc = async (title: string, parentId: string, accessToken: string, content?: string): Promise<string> => {
  try {
    // First, create the empty document to get its ID
    const createResponse = await fetch(`https://www.googleapis.com/drive/v3/files`, {
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

    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      console.error('Failed to create Google Doc:', errorBody);
      throw new Error(`Failed to create Google Doc: ${errorBody.error.message}`);
    }

    const file = await createResponse.json();
    const documentId = file.id;

    // If content is provided, update the document with it
    if (content) {
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: {
                  index: 1,
                },
                text: content,
              },
            },
          ],
        }),
      });

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.json();
        console.error('Failed to update Google Doc content:', errorBody);
        // We don't throw here because the file is already created. 
        // We can decide to handle this more gracefully later.
      }
    }

    return file.webViewLink;
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
};

export const createGoogleSheet = async (title: string, parentId: string, accessToken: string, content?: string[][]): Promise<string> => {
  try {
    // Create the empty sheet first
    const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files`, {
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

    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      console.error('Failed to create Google Sheet:', errorBody);
      throw new Error(`Failed to create Google Sheet: ${errorBody.error.message}`);
    }

    const file = await createResponse.json();
    const spreadsheetId = file.id;

    // If content is provided, update the sheet with it
    if (content) {
      const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: content,
        }),
      });

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.json();
        console.error('Failed to update Google Sheet content:', errorBody);
      }
    }

    return file.webViewLink;
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
};

export const createGoogleSlide = async (title: string, parentId: string, accessToken: string, content?: { title: string, subtitle: string }): Promise<string> => {
  try {
    // Create the empty presentation first
    const createResponse = await fetch(`https://www.googleapis.com/drive/v3/files`, {
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

    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      console.error('Failed to create Google Slide:', errorBody);
      throw new Error(`Failed to create Google Slide: ${errorBody.error.message}`);
    }

    const file = await createResponse.json();
    const presentationId = file.id;

    // If content is provided, add a title slide
    if (content) {
      const requests = [
        {
          createSlide: {
            slideLayoutReference: {
              predefinedLayout: 'TITLE_SLIDE'
            },
            placeholderIdMappings: [
              {
                layoutPlaceholder: {
                  type: 'CENTERED_TITLE'
                },
                objectId: 'title'
              },
              {
                layoutPlaceholder: {
                  type: 'SUBTITLE'
                },
                objectId: 'subtitle'
              }
            ]
          }
        },
        {
          insertText: {
            objectId: 'title',
            text: content.title
          }
        },
        {
          insertText: {
            objectId: 'subtitle',
            text: content.subtitle
          }
        }
      ];

      const updateResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests
        }),
      });

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.json();
        console.error('Failed to update Google Slide content:', errorBody);
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


