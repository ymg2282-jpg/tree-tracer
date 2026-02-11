
# Tree Location Tracker — Native Android App

## Overview
A mobile app where verified users photograph and geolocate trees, storing detailed information viewable by all users on an interactive map. Users must complete identity verification (face + government ID) approved by an admin before they can use the app.

---

## 1. User Registration & Identity Verification
- **Sign-up page** with email and password
- **Profile setup** after sign-up: full name, date of birth, living location
- **ID verification flow**: user uploads a selfie (face photo) and a photo of their government-issued ID card
- Uploads go to an admin review queue — account stays "pending" until approved
- Pending users see a "Waiting for verification" screen and cannot access the main app

## 2. Admin Panel
- Admin dashboard showing pending verification requests
- Side-by-side view of user's selfie and ID card photo for manual comparison
- Approve or reject button with optional rejection reason
- List of all verified users with ability to manage accounts

## 3. Tree Capture Flow (Main Feature)
- **Camera button** to take a photo of a tree (uses device camera)
- **Automatic GPS capture** of current location when the photo is taken
- **Detail form** after capturing:
  - Tree species name
  - Estimated height
  - Health condition (dropdown: healthy, damaged, diseased, dead)
  - Free-form notes
  - Custom tags/labels
- Save the tree entry with all data

## 4. Interactive Map View
- Full-screen map showing all trees from all users as pins/markers
- Tap a marker to see a preview card (photo thumbnail, species, who added it)
- Tap the card to open full tree details
- User's current location shown on the map
- Cluster markers when zoomed out

## 5. Tree List & Search
- Scrollable list view as an alternative to the map
- Search by species name, tags, or notes
- Filter by health condition, date added, or user who added it
- Sort by nearest, newest, or species name

## 6. Tree Detail Page
- Full-size photo
- All captured details (species, height, health, notes, tags)
- Location shown on a mini-map
- Info about who added it and when

## 7. User Profile
- View/edit own profile (name, date of birth, location, face photo)
- List of trees the user has added
- Logout

## 8. Backend (Lovable Cloud / Supabase)
- **Authentication**: email/password sign-up and login
- **Database**: users, profiles, user verification records, trees, tags
- **Storage**: tree photos, user selfies, ID card photos (stored in secure buckets)
- **Row-Level Security**: all users can view trees; only the creator can edit/delete their own trees; admin role for verification management
- **User roles table**: separate table for admin role assignment

## 9. Native Android Setup (Capacitor)
- Capacitor integration for building as a native Android APK
- Camera plugin for taking tree photos
- Geolocation plugin for GPS coordinates
- The app will connect to the hosted backend for all data

---

## Design Style
- Clean, nature-inspired color palette (greens and earth tones)
- Card-based UI for tree entries
- Bottom navigation bar: Map, Add Tree, My Trees, Profile
- Mobile-first design optimized for one-handed use
