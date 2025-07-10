

import os
import json
import google.generativeai as genai
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/presentations',
]

from google.oauth2 import service_account

def get_credentials():
    """Gets credentials from a service account file."""
    creds = service_account.Credentials.from_service_account_file(
        'resolve-wizard-3091eca562a4.json', scopes=SCOPES)
    return creds

def generate_project_details(description):
    """Generates project details using the Gemini API."""
    print("Generating project details with Gemini...")
    try:
        # Corrected model name and added safety settings
        model = genai.GenerativeModel('gemini-2.0-flash') 
        response = model.generate_content(
            f"""
            You are a project management and branding assistant. Based on the following project description, extract key details.
            Provide your response as a single, minified JSON object with no markdown.
            The JSON object MUST have these keys:
            - "projectName": A short, catchy name for the project.
            - "projectObjective": A one-sentence summary of the project's goal.
            - "brandIdentity": A brief description of the brand's personality and values.
            - "colorTheme": A hex code for a primary color that fits the project's theme (e.g., "#4285F4").
            - "kickoffMeetingTitle": A title for a calendar event for the project kick-off.

            Project Description: "{description}"
            """,
            safety_settings=[
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        )
        print("Successfully received response from Gemini.")
        # Remove the json block before parsing
        text = response.text.replace("```json", "").replace("```", "")
        return json.loads(text)
    except Exception as e:
        print(f"An error occurred while calling the Gemini API: {e}")
        # It's helpful to see the raw response if JSON parsing fails
        if 'response' in locals():
            print("--- Raw Gemini API Response ---")
            print(response.text)
            print("-----------------------------")
        raise

def create_google_doc(drive_service, docs_service, folder_id, title, content):
    """Creates a Google Doc with the given title and content."""
    file_metadata = {
        'name': title,
        'parents': [folder_id],
        'mimeType': 'application/vnd.google-apps.document'
    }
    file = drive_service.files().create(body=file_metadata, fields='id').execute()
    doc_id = file.get('id')
    docs_service.documents().batchUpdate(
        documentId=doc_id,
        body={'requests': [{'insertText': {'location': {'index': 1}, 'text': content}}]}).execute()
    return doc_id

def main():
    """Verifies the branding of generated files."""
    if "GEMINI_API_KEY" not in os.environ:
        print("Error: Please set the GEMINI_API_KEY environment variable.")
        return

    # Configure the Gemini API
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    
    creds = get_credentials()
    folder_id = None  # Initialize folder_id to ensure it's available in finally block
    
    try:
        drive_service = build('drive', 'v3', credentials=creds)
        docs_service = build('docs', 'v1', credentials=creds)

        # 1. Generate project details for a "flower seed business"
        print("Generating project details...")
        project_description = "A new online business that sells a curated selection of high-quality flower seeds."
        project_details = generate_project_details(project_description)
        project_name = project_details['projectName']
        brand_identity = project_details['brandIdentity']
        print(f"Generated Project Name: {project_name}")

        # 2. Create a Google Drive folder
        print(f"Creating Google Drive folder: {project_name}")
        folder_metadata = {'name': project_name, 'mimeType': 'application/vnd.google-apps.folder'}
        folder = drive_service.files().create(body=folder_metadata, fields='id').execute()
        folder_id = folder.get('id')

        # 3. Create a project proposal document
        print("Creating Google Doc: Project Proposal")
        proposal_title = 'Project Proposal'
        proposal_content = f"Project Proposal for {project_name}\n\n{brand_identity}"
        proposal_id = create_google_doc(drive_service, docs_service, folder_id, proposal_title, proposal_content)

        # 4. Read the content of the generated document
        print("Reading document content for verification...")
        document = docs_service.documents().get(documentId=proposal_id).execute()
        doc_content = ''
        for content_item in document.get('body').get('content'):
            if 'paragraph' in content_item:
                for element in content_item.get('paragraph').get('elements'):
                    if 'textRun' in element:
                        doc_content += element.get('textRun').get('content')

        # 5. Verify the branding
        print("Verifying branding...")
        if project_name in doc_content and brand_identity in doc_content:
            print("\nBranding verification successful!")
        else:
            print("\nBranding verification failed.")
            print(f"Expected to find '{project_name}' and '{brand_identity}'")
            print(f"Actual content: {doc_content}")

    except HttpError as error:
        print(f"An HTTP error occurred: {error}")
        print("Please ensure the Google Drive and Google Docs APIs are enabled in your Google Cloud project.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # 6. Clean up the created files
        if folder_id:
            try:
                print(f"Cleaning up created folder (ID: {folder_id})...")
                drive_service.files().delete(fileId=folder_id, supportsAllDrives=True).execute()
                print("Cleanup complete.")
            except Exception as e:
                print(f"Error during cleanup: {e}")


if __name__ == '__main__':
    main()
