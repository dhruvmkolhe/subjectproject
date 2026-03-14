# Google Drive Integration Setup

This guide will help you set up Google Drive connectivity for Phobos to enable automatic backup of cleaned files.

## Prerequisites

- A Google Cloud Project
- Google Drive API enabled
- OAuth 2.0 credentials

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **NEW PROJECT**
4. Enter a project name (e.g., "Phobos Backup")
5. Click **CREATE**
6. Wait for the project to be created, then select it

### 2. Enable Google Drive API

1. In the Cloud Console, go to **APIs & Services** > **Library**
2. Search for **"Google Drive API"**
3. Click on the Google Drive API result
4. Click **ENABLE**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Choose **OAuth 2.0 Client IDs**
4. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Click **CREATE**
   - Fill in the required fields:
     - App name: "Phobos"
     - User support email: Your email
     - Developer contact: Your email
   - Click **SAVE AND CONTINUE**
   - Skip optional scopes and go to summary
   - Click **BACK TO DASHBOARD**
5. Now create the OAuth client:
   - Go back to **APIs & Services** > **Credentials**
   - Click **+ CREATE CREDENTIALS**
   - Choose **OAuth 2.0 Client IDs**
   - Select **Web application** as the Application type
   - Name it "Phobos Frontend"
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:5173` (or your dev server URL)
     - `http://localhost:8081` (alternative port)
     - `http://127.0.0.1:5173`
   - Under **Authorized redirect URIs**, add:
     - `http://localhost:5173`
     - `http://localhost:8081`
   - Click **CREATE**
6. Copy the **Client ID** from the popup

### 4. Configure Phobos

1. Open `.env.local` in the project root
2. Add or update the following line:

   ```
   VITE_GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
   ```

   Replace `your_client_id_here` with the Client ID you copied in step 3.6

3. Save the file

### 5. Test the Integration

1. Start the development server:

   ```bash
   bun install
   bun run dev
   ```

2. In the app:
   - Sign in with your Google account
   - Upload a file and process it
   - Click **"Backup to Drive"** button
   - Authorize the app to access Google Drive when prompted
   - Verify the file appears in your Google Drive

## Troubleshooting

### "Sign in with Google" button not working

- Ensure your Google Drive Client ID is correctly set in `.env.local`
- Clear browser cache and reload the page
- Check browser console for error messages

### Backup button not appearing

- Process some files first (the button only appears after successful processing)
- Ensure you're signed in with Google

### "No permission to access Google Drive"

- Revoke app permissions from Google Account settings
- Sign out and sign back in
- Re-authorize the app to access Google Drive

### Files not appearing in Google Drive

- Check if the app has permission to write to Drive
- Verify the OAuth client credentials are correct
- Check browser console for API errors

## Security Notes

- The Client ID is safe to commit as it's restricted to specific domains
- The app uses OAuth 2.0, so your password is never shared with the app
- Files are uploaded with your Drive account credentials
- The app cannot access files outside of what you explicitly authorize

## Additional Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
