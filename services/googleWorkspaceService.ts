
import { PitchDeckContent } from '../types';

const GOOGLE_DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3';
const GOOGLE_SHEETS_API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_SLIDES_API_BASE_URL = 'https://slides.googleapis.com/v1';

export const createGoogleDriveFolder = async (folderName: string, accessToken: string): Promise<{ folderId: string, folderUrl: string }> => {
  try {
    console.log('Creating Google Drive folder:', folderName);
    const response = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files?fields=id,webViewLink`, {
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
    return { folderId: data.id, folderUrl: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}` };
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    throw error;
  }
};

export const createGoogleDoc = async (title: string, parentId: string, accessToken: string, content?: string): Promise<{ url: string }> => {
  try {
    console.log('Creating Google Doc:', title);
    const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files?fields=id,webViewLink`, {
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
    
    // Add content to the document if provided
    if (content) {
      try {
        // Process content to replace [PROJECT_LOGO] placeholder and format properly
        const formattedContent = content.replace(/\[PROJECT_LOGO\]/g, '🏢 PROJECT LOGO PLACEHOLDER 🏢');
        
        const requests = [
          {
            insertText: {
              location: { index: 1 },
              text: formattedContent
            }
          }
        ];

        // Add formatting for headers and structure
        const lines = formattedContent.split('\n');
        let currentIndex = 1;
        
        lines.forEach((line, i) => {
          if (line.includes('🏢 PROJECT LOGO PLACEHOLDER 🏢') || 
              line.includes('Executive Summary') || 
              line.includes('Problem Statement') ||
              line.includes('Proposed Solution') ||
              line.includes('Scope of Work') ||
              line.includes('Timeline & Milestones') ||
              line.includes('Expected Outcomes')) {
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: currentIndex,
                  endIndex: currentIndex + line.length
                },
                textStyle: {
                  bold: true,
                  fontSize: { magnitude: 14, unit: 'PT' }
                },
                fields: 'bold,fontSize'
              }
            });
          }
          currentIndex += line.length + 1; // +1 for newline
        });

        const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${file.id}:batchUpdate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
        });
        if (!updateResponse.ok) {
          const errorBody = await updateResponse.json();
          console.error('Failed to add content to Google Doc:', errorBody);
        }
      } catch (contentError) {
        console.error('Failed to add content to Google Doc:', contentError);
      }
    }
    
    console.log('Successfully created Google Doc:', file.id);
    return { url: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit` };
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
};

export const createGoogleSheet = async (title: string, parentId: string, accessToken: string, values?: string[][]): Promise<{ url: string }> => {
  try {
    console.log('Creating Google Sheet:', title);
    const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files?fields=id,webViewLink`, {
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
    
    // Add values to the sheet if provided
    if (values && values.length > 0) {
      try {
        const updateResponse = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}/${file.id}/values/A1:append?valueInputOption=RAW`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: values
          }),
        });
        if (!updateResponse.ok) {
          const errorBody = await updateResponse.json();
          console.error('Failed to add content to Google Sheet:', errorBody);
        }
      } catch (contentError) {
        console.error('Failed to add content to Google Sheet:', contentError);
      }
    }
    
    console.log('Successfully created Google Sheet:', file.id);
    return { url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit` };
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
};

export const createGoogleSlide = async (title: string, parentId: string, accessToken: string, content: PitchDeckContent): Promise<{ url: string }> => {
    try {
      const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE_URL}/files?fields=id,webViewLink`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: title, mimeType: 'application/vnd.google-apps.presentation', parents: [parentId] }),
      });
      if (!createResponse.ok) {
          const errorBody = await createResponse.json();
          throw new Error(`Failed to create Google Slide: ${errorBody.error?.message || 'Unknown error'}`);
      }
      const file = await createResponse.json();
      
      // Add content to the presentation if provided
      if (content) {
        try {
          // Get the presentation to find slide IDs
          const getResponse = await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/presentations/${file.id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          
          if (getResponse.ok) {
            const presentation = await getResponse.json();
            let slideId = presentation.slides?.[0]?.objectId;
            
            if (slideId) {
              const requests = [];
              
              // Clear existing content
              requests.push({
                deleteObject: {
                  objectId: presentation.slides[0].pageElements?.[0]?.objectId
                }
              });

              // Create comprehensive slide deck
              const slides = [
                { title: content.title, subtitle: content.subtitle, branding: content.brandingStatement || '🏢 Company Logo' },
                { title: content.problem?.title || 'Problem', content: content.problem?.content || 'Problem description' },
                { title: content.solution?.title || 'Solution', content: content.solution?.content || 'Solution description' },
                { title: content.marketOpportunity?.title || 'Market Opportunity', content: content.marketOpportunity?.content || 'Market details' },
                { title: content.businessModel?.title || 'Business Model', content: content.businessModel?.content || 'Revenue model' },
                { title: content.targetMarket?.title || 'Target Market', content: content.targetMarket?.content || 'Customer segments' },
                { title: content.competitiveAdvantage?.title || 'Competitive Advantage', content: content.competitiveAdvantage?.content || 'Our advantages' },
                { title: content.team?.title || 'Team', content: content.team?.content || 'Team overview' },
                { title: content.financialProjections?.title || 'Financial Projections', content: content.financialProjections?.content || 'Revenue projections' },
                { title: content.fundingRequest?.title || 'Funding Request', content: content.fundingRequest?.content || 'Investment needed' },
                { title: content.nextSteps?.title || 'Next Steps', content: content.nextSteps?.content || 'Action items' }
              ];

              // Create additional slides
              for (let i = 1; i < slides.length; i++) {
                requests.push({
                  createSlide: {
                    objectId: `slide_${i}`,
                    slideLayoutReference: {
                      predefinedLayout: 'TITLE_AND_BODY'
                    }
                  }
                });
              }

              // Add content to slides
              slides.forEach((slide, index) => {
                const currentSlideId = index === 0 ? slideId : `slide_${index}`;
                
                requests.push({
                  createShape: {
                    objectId: `title_${index}`,
                    shapeType: 'TEXT_BOX',
                    elementProperties: {
                      pageObjectId: currentSlideId,
                      size: {
                        height: { magnitude: 80, unit: 'PT' },
                        width: { magnitude: 600, unit: 'PT' }
                      },
                      transform: {
                        scaleX: 1,
                        scaleY: 1,
                        translateX: 50,
                        translateY: 50,
                        unit: 'PT'
                      }
                    }
                  }
                });

                requests.push({
                  insertText: {
                    objectId: `title_${index}`,
                    text: slide.title,
                    insertionIndex: 0
                  }
                });

                if (slide.subtitle || slide.content) {
                  requests.push({
                    createShape: {
                      objectId: `content_${index}`,
                      shapeType: 'TEXT_BOX',
                      elementProperties: {
                        pageObjectId: currentSlideId,
                        size: {
                          height: { magnitude: 300, unit: 'PT' },
                          width: { magnitude: 600, unit: 'PT' }
                        },
                        transform: {
                          scaleX: 1,
                          scaleY: 1,
                          translateX: 50,
                          translateY: 150,
                          unit: 'PT'
                        }
                      }
                    }
                  });

                  requests.push({
                    insertText: {
                      objectId: `content_${index}`,
                      text: slide.subtitle || slide.content || '',
                      insertionIndex: 0
                    }
                  });
                }
              });

              const updateResponse = await fetch(`${GOOGLE_SLIDES_API_BASE_URL}/presentations/${file.id}:batchUpdate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests }),
              });
              
              if (!updateResponse.ok) {
                const errorBody = await updateResponse.json();
                console.error('Failed to add content to Google Slide:', errorBody);
              }
            }
          }
        } catch (contentError) {
          console.error('Failed to add content to Google Slide:', contentError);
        }
      }
      
      console.log('Successfully created Google Slide:', file.id);
      return { url: file.webViewLink || `https://docs.google.com/presentation/d/${file.id}/edit` };
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
