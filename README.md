# SRM University-AP Project Management Portal

A comprehensive project management portal for SRM University-AP with Google OAuth integration, assessment workflows, and modern UI.

## Features

- 🔐 Google OAuth authentication with domain restriction (@srmap.edu.in)
- 👥 Role-based access control (Student, Faculty, Admin)
- 📝 Assessment creation with automatic Google Meet links
- 📁 File submission and grading system
- 📊 Real-time analytics and reporting
- 🎨 Modern glassmorphism UI with 3D animations
- 📱 Fully responsive design

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion + Three.js
- **Backend**: Node.js + Express + TypeScript + MongoDB + Socket.IO
- **Authentication**: Google OAuth 2.0 + JWT
- **File Storage**: Cloudinary
- **Deployment**: Vercel (Frontend) + Render (Backend) + MongoDB Atlas

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB Atlas account
- Google Cloud Console project
- Cloudinary account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd srm-project-portal
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables (see Environment Setup section below)

4. Start development servers:
```bash
pnpm dev
```

## Environment Setup

### Required API Keys and Tokens

The following environment variables need to be configured:

#### Backend (.env in apps/api)
```env
# Database
MONGODB_URI=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_CALENDAR_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env in apps/web)
```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=
```

### Google Cloud Console Setup

1. Create a new project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the following APIs:
   - Google+ API
   - Google Calendar API
3. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
   - Authorized JavaScript origins: `http://localhost:5173`
4. Configure OAuth consent screen with @srmap.edu.in domain restriction

### MongoDB Atlas Setup

1. Create a cluster in [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist your IP address
4. Get the connection string

### Cloudinary Setup

1. Create account at [Cloudinary](https://cloudinary.com)
2. Get your cloud name, API key, and API secret from the dashboard

## Development

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm seed` - Seed database with demo data

### Project Structure

```
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend
├── packages/
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configurations
└── docs/             # Documentation
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set build command: `cd apps/web && pnpm build`
3. Set output directory: `apps/web/dist`
4. Add environment variables

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd apps/api && pnpm build`
4. Set start command: `cd apps/api && pnpm start`
5. Add environment variables

## License

MIT License - see LICENSE file for details