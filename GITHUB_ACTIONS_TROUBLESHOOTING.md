# GitHub Actions Refresh Troubleshooting Guide

## 🚨 **ISSUE IDENTIFIED: GitHub Actions Refresh Failing**

The GitHub Actions refresh job was failing due to **incorrect endpoint URL**. Here's what was wrong and how it's been fixed.

## ❌ **The Problem**

### **Error Message:**
```
curl: (3) URL rejected: No host part in the URL
```

### **Root Cause:**
1. **Wrong endpoint**: The workflow was calling `/api/cron/daily` which doesn't exist
2. **Missing hostname**: The URL was malformed
3. **Incorrect authentication**: Using query parameter instead of Authorization header

### **Original Broken Code:**
```yaml
curl -X GET "${{ secrets.SITE_URL }}/api/cron/daily?secret=${{ secrets.CRON_SECRET }}"
```

## ✅ **The Fix**

### **Updated GitHub Actions Workflow:**
```yaml
# Proper authentication and correct endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET \
  -H "Content-Type: application/json" \
  -H "User-Agent: GitHub-Actions-Content-Refresh" \
  -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
  "${{ secrets.SITE_URL }}/api/scheduler/cron")
```

### **Key Changes:**
1. ✅ **Correct endpoint**: `/api/scheduler/cron` (was `/api/cron/daily`)
2. ✅ **Proper authentication**: Authorization header (was query parameter)
3. ✅ **Error handling**: HTTP status code checking
4. ✅ **Detailed logging**: Response parsing and reporting

## 🔧 **Required GitHub Secrets**

Make sure these secrets are set in your GitHub repository:

### **Required Secrets:**
1. **`SITE_URL`**: Your deployed site URL
   - Example: `https://fantasy-redzone-dzvioueub-james-projects-cf25d43f.vercel.app`
   - **Must include protocol** (https://)

2. **`CRON_SECRET`**: Security token for cron authentication
   - Must match the `CRON_SECRET` in your Vercel environment variables
   - Used for API authentication

3. **`REFRESH_TOKEN`**: Token for manual refresh operations
   - Used by backup workflow
   - Must match the `REFRESH_TOKEN` in your Vercel environment variables

### **How to Set Secrets:**
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the correct name and value

## 📋 **Workflow Files**

### **Primary Workflow: `refresh-content.yml`**
- **Schedule**: Every 4 hours (6 AM, 10 AM, 2 PM, 6 PM, 10 PM UTC)
- **Endpoint**: `/api/scheduler/cron`
- **Method**: GET with Authorization header

### **Backup Workflow: `refresh-content-backup.yml`**
- **Schedule**: Every 6 hours (12 AM, 6 AM, 12 PM, 6 PM UTC)
- **Multiple endpoints**: Tries 3 different refresh methods
- **Fallback**: If primary fails, tries alternative endpoints

## 🧪 **Testing the Fix**

### **1. Test Locally:**
```bash
# Test the correct endpoint
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "http://localhost:3000/api/scheduler/cron"
```

### **2. Test Production:**
```bash
# Test your deployed site
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://your-site.vercel.app/api/scheduler/cron"
```

### **3. Manual GitHub Actions Test:**
1. Go to **Actions** tab in GitHub
2. Select **Refresh Content** workflow
3. Click **Run workflow** → **Run workflow**
4. Check the logs for success/failure

## 🔍 **Troubleshooting Steps**

### **If GitHub Actions Still Fails:**

1. **Check Secrets:**
   ```bash
   # Verify secrets are set (in workflow logs)
   echo "SITE_URL: ${{ secrets.SITE_URL }}"
   echo "CRON_SECRET: ${CRON_SECRET:0:10}..."
   ```

2. **Test Endpoint Manually:**
   ```bash
   # Test the exact URL from your secrets
   curl -v "YOUR_SITE_URL/api/scheduler/cron"
   ```

3. **Check Authentication:**
   ```bash
   # Test with proper auth header
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     "YOUR_SITE_URL/api/scheduler/cron"
   ```

4. **Verify Environment Variables:**
   - Check Vercel dashboard for `CRON_SECRET`
   - Ensure it matches GitHub secret

### **Common Issues:**

#### **"No host part in the URL"**
- **Cause**: Missing `https://` in SITE_URL
- **Fix**: Ensure SITE_URL starts with `https://`

#### **"401 Unauthorized"**
- **Cause**: CRON_SECRET mismatch
- **Fix**: Update GitHub secret to match Vercel environment variable

#### **"404 Not Found"**
- **Cause**: Wrong endpoint path
- **Fix**: Use `/api/scheduler/cron` (not `/api/cron/daily`)

#### **"500 Internal Server Error"**
- **Cause**: Server-side error
- **Fix**: Check Vercel function logs for details

## 📊 **Monitoring Success**

### **Successful Run Indicators:**
- ✅ **HTTP 200** status code
- ✅ **"ingestionTriggered": true** in response
- ✅ **No error messages** in logs
- ✅ **Content updates** visible on your site

### **Health Check Verification:**
```bash
# Check if content is being updated
curl "https://your-site.vercel.app/api/health"
```

## 🚀 **Alternative Solutions**

### **If GitHub Actions Continues to Fail:**

1. **Use Vercel Cron (Primary):**
   - Already configured in `vercel.json`
   - Runs daily at 6:00 AM EST
   - More reliable than GitHub Actions

2. **Manual Refresh Script:**
   ```bash
   # Run locally or on any server
   node refresh-now.js
   ```

3. **External Cron Service:**
   - Set up cron job on your own server
   - Call the refresh endpoints directly

## ✅ **Verification Checklist**

- [ ] **GitHub secrets** are properly set
- [ ] **SITE_URL** includes `https://` protocol
- [ ] **CRON_SECRET** matches Vercel environment variable
- [ ] **Endpoint** is `/api/scheduler/cron` (not `/api/cron/daily`)
- [ ] **Authentication** uses Authorization header
- [ ] **Workflow** runs successfully in GitHub Actions
- [ ] **Content** is being updated on your site
- [ ] **Health check** shows healthy status

## 📞 **Emergency Procedures**

### **If All Automated Methods Fail:**
1. **Manual refresh**: `node refresh-now.js`
2. **Check health**: `node monitor-content.js`
3. **Review logs**: Check Vercel function logs
4. **Contact support**: If issues persist

**The GitHub Actions refresh should now work correctly with the updated workflow configuration!**
