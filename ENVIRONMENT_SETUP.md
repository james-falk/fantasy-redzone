# Environment Configuration Guide

## 🌍 Environment Unification Strategy

This project implements a **unified environment configuration** that ensures identical behavior between local development and production, with the only difference being the MongoDB connection URL.

### 🎯 Core Principles

1. **Single Source of Truth**: All environment variables are defined in one place
2. **Environment-Agnostic Code**: Application logic is identical across environments
3. **Secure Configuration**: Sensitive data is never hardcoded or committed to version control
4. **Consistent Validation**: All environments use the same validation and error handling

## 📁 File Structure

```
├── env.example                 # Template for environment variables
├── .env.local                  # Local development configuration (gitignored)
├── src/lib/environment.ts      # Centralized environment utility
├── src/lib/mongodb.ts          # Database connection with environment handling
└── vercel.json                 # Production deployment configuration
```

## 🔧 Local Development Setup

### Step 1: Create Local Environment File

```bash
# Copy the template
cp env.example .env.local

# Edit with your local values
nano .env.local
```

### Step 2: Configure Local Environment Variables

```env
# =============================================================================
# SITE CONFIGURATION (Same for all environments)
# =============================================================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Fantasy Red Zone
NEXT_PUBLIC_SITE_DESCRIPTION=Your ultimate destination for fantasy football content

# =============================================================================
# AUTHENTICATION CONFIGURATION (Same for all environments)
# =============================================================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-nextauth-secret-here

# OAuth Providers (configure as needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# =============================================================================
# DATABASE CONFIGURATION (Environment-specific)
# =============================================================================
# LOCAL DEVELOPMENT: Use your local MongoDB URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fantasyredzone?retryWrites=true&w=majority&appName=fantasy-redzone

# =============================================================================
# EXTERNAL API CONFIGURATION (Same for all environments)
# =============================================================================
YOUTUBE_API_KEY=your-youtube-api-key-here

# =============================================================================
# FEATURE FLAGS (Same for all environments)
# =============================================================================
ENABLE_AI_CHAT=false
ENABLE_TEAM_INSIGHTS=false
ENABLE_NAME_GENERATOR=false
```

## 🚀 Production Deployment (Vercel)

### Step 1: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each environment variable from `env.example`

### Step 2: Required Production Environment Variables

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
NEXT_PUBLIC_SITE_NAME=Fantasy Red Zone
NEXT_PUBLIC_SITE_DESCRIPTION=Your ultimate destination for fantasy football content

# Authentication
NEXTAUTH_URL=https://your-site.vercel.app
NEXTAUTH_SECRET=your-production-nextauth-secret

# Database (PRODUCTION-SPECIFIC)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fantasyredzone?retryWrites=true&w=majority&appName=fantasy-redzone

# External APIs
YOUTUBE_API_KEY=your-youtube-api-key

# Feature Flags
ENABLE_AI_CHAT=false
ENABLE_TEAM_INSIGHTS=false
ENABLE_NAME_GENERATOR=false

# Optional: Deployment & Automation
CRON_SECRET=your-secure-random-string
REFRESH_TOKEN=your-youtube-refresh-token
```

## 🔒 Security Best Practices

### Environment Variable Management

1. **Never commit sensitive data**:
   ```bash
   # .gitignore ensures .env.local is never committed
   .env.local
   .env.production
   .env.*.local
   ```

2. **Use different secrets per environment**:
   - Local: `NEXTAUTH_SECRET=local-dev-secret`
   - Production: `NEXTAUTH_SECRET=production-secure-secret`

3. **Rotate secrets regularly**:
   - Generate new `NEXTAUTH_SECRET` for production
   - Update API keys when compromised

### MongoDB Connection Security

1. **Use connection string authentication**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database
   ```

2. **Enable network access controls**:
   - Configure IP whitelist in MongoDB Atlas
   - Use VPC peering for enhanced security

3. **Use read-only users for specific operations**:
   - Create separate users for read/write operations
   - Implement least privilege access

## 🛠️ Environment Utility Usage

### Basic Usage

```typescript
import { getEnvironmentConfig, getEnvVar } from '@/lib/environment'

// Get full environment configuration
const config = getEnvironmentConfig()

// Get specific environment variable
const apiKey = getEnvVar('YOUTUBE_API_KEY')

// Check environment type
if (config.isProduction) {
  // Production-specific logic
}
```

### Database Connection

```typescript
import { connectToDatabase } from '@/lib/mongodb'

// Automatically uses correct MongoDB URI for environment
const connection = await connectToDatabase()
```

### Environment Validation

```typescript
import { logEnvironmentInfo } from '@/lib/environment'

// Log environment configuration (without sensitive data)
logEnvironmentInfo()
```

## 🔍 Debugging Environment Issues

### Local Development

1. **Check environment file**:
   ```bash
   cat .env.local
   ```

2. **Validate environment variables**:
   ```bash
   npm run dev
   # Check console for environment validation messages
   ```

3. **Test database connection**:
   ```bash
   curl http://localhost:3000/api/debug
   ```

### Production (Vercel)

1. **Check environment variables**:
   - Vercel Dashboard → Settings → Environment Variables
   - Verify all required variables are set

2. **View deployment logs**:
   - Vercel Dashboard → Deployments → Latest
   - Check build and runtime logs

3. **Test production environment**:
   ```bash
   curl https://your-site.vercel.app/api/debug
   ```

## 📋 Environment Variable Checklist

### Required for All Environments

- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_SITE_NAME`
- [ ] `NEXT_PUBLIC_SITE_DESCRIPTION`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `MONGODB_URI`
- [ ] `YOUTUBE_API_KEY`

### Optional

- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `ENABLE_AI_CHAT`
- [ ] `ENABLE_TEAM_INSIGHTS`
- [ ] `ENABLE_NAME_GENERATOR`
- [ ] `CRON_SECRET`
- [ ] `REFRESH_TOKEN`

## 🚨 Common Issues and Solutions

### Issue: "MONGODB_URI environment variable is missing"

**Solution**: 
- Local: Check `.env.local` file exists and contains `MONGODB_URI`
- Production: Verify `MONGODB_URI` is set in Vercel environment variables

### Issue: "YouTube API key is required but not configured"

**Solution**:
- Ensure `YOUTUBE_API_KEY` is set in both local and production environments
- Verify API key is valid and has proper permissions

### Issue: Build fails in production

**Solution**:
- Check Vercel build logs for missing environment variables
- Ensure all required variables are set in Vercel dashboard
- Verify environment variable names match exactly (case-sensitive)

## 🔄 Environment Synchronization

### Keeping Environments in Sync

1. **Update template first**:
   ```bash
   # Edit env.example with new variables
   nano env.example
   ```

2. **Update local environment**:
   ```bash
   # Add new variables to .env.local
   nano .env.local
   ```

3. **Update production environment**:
   - Add new variables in Vercel dashboard
   - Redeploy to apply changes

### Automated Validation

The environment utility automatically validates required variables and provides clear error messages for missing configuration.

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Atlas Security](https://docs.atlas.mongodb.com/security/)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
