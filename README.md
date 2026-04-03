# Humor Flavor Prompt Chain Tool

A modern admin dashboard for managing humor flavors and generating captions using prompt chains.

## Features

- ✨ Create, read, update, and delete humor flavors
- 🔗 Manage humor flavor steps with drag-and-drop reordering
- 🎨 Dark/light/system mode support
- 🔐 Admin-only access (requires superadmin or matrix_admin role)
- 🧪 Test captions generation using the REST API
- 🌐 Modern, sleek hacker-style interface
- ⚡ Built with Next.js 14, React 18, TypeScript
- 🎯 Tailwind CSS for styling
- 🔄 Real-time state management with Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account for authentication
- Access to api.almostcrackd.ai REST API

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd humor-flavor-prompt-chain
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials and API keys:
```
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_KEY=your-service-key
API_BASE_URL=https://api.almostcrackd.ai
API_KEY=your-api-key
```

4. Enable Google OAuth in Supabase:
   - Go to your Supabase project settings
   - Navigate to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials (from Google Cloud Console)
   - Add redirect URI: `http://localhost:3000/auth/callback` (for local development)

### Running the Application

Development:
```bash
npm run dev
```

Build:
```bash
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Login page
│   ├── dashboard/
│   │   └── page.tsx        # Main dashboard
│   └── globals.css         # Global styles
├── components/
│   ├── header.tsx          # Navigation header
│   ├── login-form.tsx      # Auth form
│   ├── flavor-list.tsx     # Flavor list sidebar
│   ├── flavor-editor.tsx   # Flavor creation/editing modal
│   ├── flavor-tester.tsx   # Caption generation tester
│   └── index.ts            # Component exports
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── auth-provider.tsx   # Auth context provider
│   ├── providers.tsx       # Theme provider
│   ├── api-client.ts       # REST API client
│   └── store.ts            # Zustand store
├── public/                 # Static assets
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
├── next.config.js          # Next.js configuration
└── tsconfig.json           # TypeScript configuration
```

## Authentication

The application uses **Google OAuth (SSO)** for authentication via Supabase.

**Setup Requirements:**
1. Create a Google OAuth app in [Google Cloud Console](https://console.cloud.google.com)
2. Add Authorized redirect URIs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-vercel-domain.vercel.app/auth/callback`
3. Enable Google provider in your Supabase project
4. Add your Google OAuth Client ID and Secret to Supabase

**Access Control (Optional):**
- Currently, all authenticated users can access the dashboard
- To enable role-based access control, set `NEXT_PUBLIC_ENABLE_ROLE_CHECK=true` in `.env.local`
- When enabled, requires one of these roles in the `profiles` table:
  - `is_superadmin = TRUE`
  - `is_matrix_admin = TRUE`

## API Integration

The tool integrates with the REST API at `api.almostcrackd.ai` for:
- CRUD operations on humor flavors
- Managing humor flavor steps
- Reordering steps
- Testing caption generation

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect the repository to Vercel
3. Set environment variables in Vercel settings
4. Disable deployment protection in Vercel settings for incognito mode testing
5. Deploy

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS 3, Framer Motion
- **State Management**: Zustand
- **Authentication**: Supabase
- **UI Components**: Lucide React
- **Drag & Drop**: React Beautiful DnD
- **HTTP Client**: Axios

## License

Private project for authorized use only.
