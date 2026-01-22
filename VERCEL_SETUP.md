# Quick Setup Guide - Connect POS App to Backend API

## ✅ Already Configured!

Your POS app is now configured to connect to your backend API at:
**`https://pos-backend-sooty.vercel.app`**

### URLs:
- **Backend API**: `https://pos-backend-sooty.vercel.app`
- **Admin Panel**: `https://pos-admin-l9z6.vercel.app/dashboard`
- **User POS App**: `https://my-pos-app-eight.vercel.app/`

## What Was Changed:

1. ✅ Updated default backend API URL to `https://pos-backend-sooty.vercel.app`
2. ✅ Fixed sync endpoint to use `/sync/batch` (matches backend)
3. ✅ Verified all API endpoints match backend structure
4. ✅ POS app now connects directly to backend API (not admin panel)

## Next Steps:

### Option 1: Use Default (Recommended)
The app will automatically connect to `https://pos-backend-sooty.vercel.app` without any configuration needed!

### Option 2: Set Environment Variable in Vercel (Optional)
If you want to override the default or use a different backend:

1. Go to your **Vercel Dashboard**
2. Select your **POS app project** (`my-pos-app-eight`)
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Key:** `REACT_APP_CLOUD_SERVER`
   - **Value:** `https://pos-backend-sooty.vercel.app`
   - **Environment:** All (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your app

## How It Works:

1. **User places order** in POS app (`https://my-pos-app-eight.vercel.app/`)
2. **Order is sent** to backend API at `https://pos-backend-sooty.vercel.app/api/orders`
3. **Backend saves** the order to MongoDB database
4. **Admin panel** (`https://pos-admin-l9z6.vercel.app/dashboard`) fetches orders from the same backend
5. **Order appears** in admin panel dashboard automatically
6. **Real-time sync** happens automatically when both apps are online

## API Endpoints Used:

- `POST /api/orders` - Create new order
- `POST /api/sync/batch` - Batch sync orders (with fallback to `/sync/batch`)
- `GET /api/orders` - Fetch all orders
- `PATCH /api/orders/:id` - Update order status
- `GET /api/health` - Health check

## Testing:

1. **All apps are already deployed** on Vercel:
   - **POS App (User)**: `https://my-pos-app-eight.vercel.app/`
   - **Admin Panel**: `https://pos-admin-l9z6.vercel.app/dashboard`
   - **Backend API**: `https://pos-backend-sooty.vercel.app`
2. **Open POS app** in browser: `https://my-pos-app-eight.vercel.app/`
3. **Place an order** (add items, enter customer name, click "Place Order")
4. **Open admin panel** in another tab: `https://pos-admin-l9z6.vercel.app/dashboard`
5. **Check admin panel** - the order should appear immediately!
6. **Refresh admin panel** if needed to see new orders

## Troubleshooting:

### Orders not appearing in admin panel?

1. **Check browser console** (F12) in POS app for connection logs:
   - Look for: `🌐 Using CLOUD server: https://pos-backend-sooty.vercel.app`
   - Look for: `✅ Order synced to server`
   - Look for: `✅ ORDER SAVED SUCCESSFULLY` (in backend logs)

2. **Check CORS settings** in your backend:
   - Backend should allow requests from both POS app and admin panel
   - Backend already has CORS configured to allow all origins (`origin: '*'`)

3. **Verify backend API endpoints**:
   - Check backend health: `https://pos-backend-sooty.vercel.app/health`
   - Should return: `{"status":"ok","message":"POS Backend Server is running",...}`
   - Verify `/api/orders` endpoint exists

4. **Check network tab**:
   - Open browser DevTools → Network tab in POS app
   - Place an order and check if POST request to `https://pos-backend-sooty.vercel.app/api/orders` succeeds (status 201)
   - Check if POST to `/sync/batch` succeeds (status 207)

5. **Check admin panel**:
   - Open admin panel: `https://pos-admin-l9z6.vercel.app/dashboard`
   - Click refresh button to fetch latest orders from backend
   - Check browser console for any errors

### Still having issues?

- Check that both apps are deployed and accessible
- Verify the admin panel API is responding correctly
- Check browser console for specific error messages

## Support:

If you need help, check the `DEPLOYMENT.md` file for detailed instructions.
