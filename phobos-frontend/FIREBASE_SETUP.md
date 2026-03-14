# Firebase Authentication Setup Guide

## Installation Complete ✓

Firebase has been installed (`npm install firebase`).

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Follow the setup wizard
4. Enable Google authentication in Firebase Console:
   - Go to Authentication → Sign-in method
   - Enable Google
   - Add your domain to authorized domains (e.g., localhost, your deployed domain)

### 2. Get Your Firebase Credentials

1. In Firebase Console, go to Project Settings (⚙️ icon)
2. Click on "Your apps" section
3. Register a web app if you haven't already
4. Copy the Firebase config object

### 3. Configure Environment Variables

Create a `.env.local` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Example values (update with your own):

```env
VITE_FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=phobos-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=phobos-project
VITE_FIREBASE_STORAGE_BUCKET=phobos-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4. Restart the Dev Server

After setting up `.env.local`, restart your dev server:

```bash
npm run dev
```

## Features Implemented

✅ **Google Sign-In**

- Click "Sign in with Google" button on home page
- Firebase handles the authentication popup

✅ **User Display in Header**

- After signing in, user's name appears in top right corner
- User's profile picture (if available) is displayed
- Click on profile to see email and sign out option

✅ **Authentication State Management**

- App checks Firebase auth state on load
- User data persists across page refreshes
- All pages have access to user information

✅ **Sign Out**

- Click on user profile menu → Sign Out
- User is logged out and redirected to home page

## Files Modified

- `src/lib/firebase.ts` - Firebase configuration
- `src/App.tsx` - Firebase auth state management
- `src/components/Header.tsx` - User profile display
- `src/components/GoogleSignInButton.tsx` - Firebase sign-in
- `src/pages/Home.tsx` - Updated to handle user
- `src/pages/Documentation.tsx` - Updated to pass user prop
- `src/pages/UploadFiles.tsx` - Updated to pass user prop
- `src/pages/CleanedFiles.tsx` - Updated to pass user prop

## Troubleshooting

**CORS Error?**
If you get a CORS error when Firebase tries to load scripts, make sure:

- Your domain is added to authorized domains in Firebase Console
- You're using the correct Firebase project credentials

**"Cannot find module firebase/auth"?**

- Clear `.eslintcache` if it exists
- Restart the dev server with `npm run dev`
- The IDE's TypeScript server might need to refresh

**Sign in popup doesn't appear?**

- Check if Firebase project is properly configured
- Ensure Google provider is enabled in Firebase Authentication
- Check browser console for specific errors
