# Fantasy Red Zone

Your ultimate destination for fantasy football analysis, insights, and tools. Built on Next.js 15 with modern TypeScript, Tailwind CSS, MongoDB, and NextAuth.js authentication.

## 🚀 Features

- **Modern Authentication**: Secure user authentication with NextAuth.js and OAuth providers
- **Database Integration**: MongoDB for data persistence and user management
- **Responsive Design**: Beautiful, mobile-first UI built with Tailwind CSS
- **TypeScript**: Full type safety and modern development experience
- **Real-time Updates**: Live data and personalized content recommendations
- **Advanced Analytics**: Comprehensive fantasy football tools and insights

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: NextAuth.js with OAuth providers
- **Database**: MongoDB Atlas
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- OAuth provider credentials (Google, etc.)

### Environment Variables

Create a `.env.local` file with:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
NEXT_PUBLIC_SITE_NAME=Fantasy Red Zone
NEXT_PUBLIC_SITE_DESCRIPTION=Your ultimate destination for fantasy football content

# NextAuth.js Configuration
NEXTAUTH_URL=https://your-site.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-here

# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# OAuth Providers (configure as needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                 # Next.js 13+ app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── globals.css     # Global styles
├── components/         # Reusable React components
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── utils/             # Helper functions
```

## 🔧 Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

The project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📝 License

This project is licensed under the MIT License. 