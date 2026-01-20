# Deployment Guide - Connecting to Admin Panel

This guide explains how to connect your POS app (deployed on Vercel) to your admin panel backend API.

## Prerequisites

- Your admin panel API should be deployed and accessible
- You need the admin panel API base URL (e.g., `https://your-admin-panel.vercel.app`)

## Step 1: Get Your Admin Panel API URL

1. Identify your admin panel API base URL
   - **Your Admin Panel**: `https://pos-admin-l9z6.vercel.app` (already configured as default)
   - If you have a different admin panel: Use the base URL without `/api` suffix (the app adds `/api` automatically)
   - **Important**: Use the base URL without `/dashboard` or `/api` suffix

## Step 2: Configure Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your POS app project
3. Navigate to **Settings** > **Environment Variables**
4. Add the following environment variable:

   **Variable Name:** `REACT_APP_CLOUD_SERVER`
   
   **Value:** `https://pos-admin-l9z6.vercel.app` (or your admin panel API base URL)
   
   **Environment:** Select all (Production, Preview, Development)
   
   **Note:** If you don't set this variable, it will default to `https://pos-admin-l9z6.vercel.app`

5. Click **Save**

## Step 3: Redeploy Your Application

After adding the environment variable:

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** (three dots) on your latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

## Step 4: Verify Connection

1. Open your deployed POS app
2. Open browser console (F12)
3. Look for logs like:
   - `🌐 Using CLOUD server: https://your-admin-panel.vercel.app`
   - `✅ Server available: https://your-admin-panel.vercel.app`

## API Endpoints Expected

Your admin panel API should expose the following endpoints:

- `GET /api/health` - Health check endpoint
- `GET /api/products` - Fetch products
- `POST /api/products/bulk` - Sync products
- `GET /api/orders` - Fetch orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order
- `GET /api/stats` - Fetch statistics

## Local Development

For local development, create a `.env` file in the root directory:

```env
REACT_APP_CLOUD_SERVER=http://localhost:3001
```

Or if your admin panel runs on a different port:

```env
REACT_APP_CLOUD_SERVER=http://localhost:YOUR_PORT
```

## Troubleshooting

### App not connecting to admin panel

1. **Check environment variable**: Ensure `REACT_APP_CLOUD_SERVER` is set correctly in Vercel
2. **Verify API URL**: Make sure the URL doesn't include `/api` suffix
3. **Check CORS**: Ensure your admin panel API allows requests from your Vercel domain
4. **Check health endpoint**: Verify `GET /api/health` endpoint exists and returns 200 OK

### CORS Issues

If you see CORS errors, add your Vercel domain to the admin panel's CORS configuration:

```javascript
// In your admin panel backend
const cors = require('cors');
app.use(cors({
  origin: [
    'https://your-pos-app.vercel.app',
    'http://localhost:3000' // for local dev
  ]
}));
```

### Connection falls back to localhost

If the app falls back to localhost, it means:
- The cloud server is not reachable
- The health check endpoint (`/api/health`) is not responding
- Check browser console for specific error messages

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_CLOUD_SERVER` | Admin panel API base URL | `https://admin-api.vercel.app` |
| `REACT_APP_LOCAL_SERVER` | Local hotspot fallback URL | `http://192.168.137.1:3001` |
