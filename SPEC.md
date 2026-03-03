# Votaciones - Sistema de Control de Votantes

## 1. Project Overview

**Project Name:** Votaciones  
**Type:** Mobile-first Web Application  
**Core Functionality:** Secure system to import voter data from Excel, track voting status, and monitor voter referrals  
**Target Users:** Single administrator managing voter check-ins on mobile devices

## 2. Technology Stack

- **Backend:** Node.js + Express.js
- **Database:** SQLite (file-based, simple, adequate for small-medium datasets)
- **Frontend:** React + Vite
- **Authentication:** JWT tokens with bcrypt password hashing
- **Excel Import:** xlsx library
- **UI Framework:** Custom CSS (mobile-first design)

## 3. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Voters Table
```sql
CREATE TABLE voters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  mesa TEXT NOT NULL,
  referidor TEXT,
  voted BOOLEAN DEFAULT 0,
  voted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Security Features

- **Password Hashing:** bcrypt with salt rounds
- **Authentication:** JWT tokens (24h expiry)
- **Token Storage:** LocalStorage (mobile-friendly)
- **Input Validation:** All inputs sanitized
- **No Password Modification:** Voters cannot be modified once voted

## 5. UI/UX Specification

### Color Palette
- **Primary:** #1a1a2e (Dark blue)
- **Secondary:** #16213e (Navy)
- **Accent:** #e94560 (Coral red)
- **Success:** #00d9a5 (Teal green)
- **Background:** #0f0f1a (Very dark)
- **Surface:** #1f1f3a (Card background)
- **Text Primary:** #ffffff
- **Text Secondary:** #a0a0b0

### Typography
- **Font Family:** 'Inter', sans-serif
- **Headings:** Bold, 1.5rem - 2rem
- **Body:** Regular, 1rem
- **Small:** 0.875rem

### Layout (Mobile-First)
- **Max Width:** 480px (mobile optimized)
- **Padding:** 16px
- **Border Radius:** 12px (cards), 8px (buttons/inputs)
- **Touch Targets:** Minimum 44px height

### Pages

#### 1. Login Page
- Logo/Title
- Username input
- Password input
- Login button
- Error message display

#### 2. Dashboard (Main Page)
- Header with logout button
- Stats cards (Total, Votados, Pendientes)
- Import Excel button
- Search/Filter bar
- Voter list (scrollable)
- Floating action button for quick vote

#### 3. Voter List Item
- Name and CEDULA
- Mesa number badge
- Referrer info
- Voted status indicator (checkmark or pending)
- Tap to mark as voted (only if not voted)

#### 4. Import Modal
- File upload area
- Preview of data to import
- Confirm import button

## 6. Functionality Specification

### Authentication
- Single user account (username: admin)
- Password set via environment or initialization
- JWT token stored in localStorage
- Auto-logout on token expiry

### Excel Import
- Accept .xlsx and .xls files
- Expected columns: CEDULA, NOMBRE, MESA, REFERIDOR
- Batch insert with duplicate handling (skip duplicates)
- Show import results (success/failed count)

### Voter Management
- List all voters with search/filter
- Filter by: All, Votados, Pendientes
- Search by name or CEDULA
- Mark voter as voted (one-click)
- View voter details including referrer

### Voting Protection
- Once voted = TRUE, record becomes read-only
- Cannot edit name, CEDULA, mesa, or referrer
- Cannot mark as "not voted" again
- Only new voters can be added/modified

### Referral Tracking
- Display referrer name for each voter
- Filter voters by referrer
- Statistics per referrer

## 7. API Endpoints

### Auth
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout (client-side token removal)

### Voters
- `GET /api/voters` - List all voters (with filters)
- `GET /api/voters/:id` - Get single voter
- `POST /api/voters` - Create new voter
- `PUT /api/voters/:id` - Update voter (blocked if voted)
- `POST /api/voters/:id/vote` - Mark as voted
- `POST /api/voters/import` - Import from Excel

### Stats
- `GET /api/stats` - Get voting statistics

## 8. File Structure

```
votaciones/
├── server/
│   ├── index.js          # Express server
│   ├── database.js       # SQLite setup
│   ├── auth.js           # Authentication middleware
│   ├── routes/
│   │   ├── auth.js       # Auth routes
│   │   └── voters.js     # Voter routes
│   └── utils/
│       └── excel.js      # Excel import utility
├── client/
│   ├── src/
│   │   ├── App.jsx       # Main app component
│   │   ├── main.jsx      # Entry point
│   │   ├── index.css     # Global styles
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── components/
│   │   │   ├── VoterList.jsx
│   │   │   ├── VoterItem.jsx
│   │   │   ├── Stats.jsx
│   │   │   ├── ImportModal.jsx
│   │   │   └── SearchBar.jsx
│   │   └── api/
│   │       └── api.js    # API calls
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .env
├── package.json
└── SPEC.md
```

## 9. Acceptance Criteria

1. ✅ Single user can login securely with hashed password
2. ✅ Excel file can be imported with CEDULA, NOMBRE, MESA, REFERIDOR columns
3. ✅ Voter list displays all imported voters
4. ✅ Can mark voter as voted with single tap
5. ✅ Voted records cannot be modified
6. ✅ Search and filter functionality works
7. ✅ Referral information is visible
8. ✅ Statistics show accurate counts
9. ✅ Mobile-friendly design with touch-optimized UI
10. ✅ JWT authentication protects all API endpoints
