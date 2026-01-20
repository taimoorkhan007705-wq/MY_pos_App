# Quick Setup Guide - Connect POS App to Admin Panel

## ✅ Already Configured!

Your POS app is now configured to connect to your admin panel at:
**`https://pos-admin-l9z6.vercel.app`**

## What Was Changed:

1. ✅ Updated default admin panel URL to `https://pos-admin-l9z6.vercel.app`
2. ✅ Fixed API endpoints to use `/api/` prefix consistently
3. ✅ Added fallback support for different endpoint structures

## Next Steps:

### Option 1: Use Default (Recommended)
The app will automatically connect to `https://pos-admin-l9z6.vercel.app` without any configuration needed!

### Option 2: Set Environment Variable in Vercel (Optional)
If you want to override the default or use a different admin panel:

1. Go to your **Vercel Dashboard**
2. Select your **POS app project**
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Key:** `REACT_APP_CLOUD_SERVER`
   - **Value:** `https://pos-admin-l9z6.vercel.app`
   - **Environment:** All (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your app

## How It Works:

1. **User places order** in POS app (user panel)
2. **Order is sent** to admin panel API at `https://pos-admin-l9z6.vercel.app/api/orders`
3. **Admin panel receives** the order and displays it in the dashboard
4. **Real-time sync** happens automatically when both apps are online

## API Endpoints Used:

- `POST /api/orders` - Create new order
- `POST /api/sync/batch` - Batch sync orders (with fallback to `/sync/batch`)
- `GET /api/orders` - Fetch all orders
- `PATCH /api/orders/:id` - Update order status
- `GET /api/health` - Health check

## Testing:

1. **Deploy your POS app** to Vercel
2. **Open both apps**:
   - POS App (User Panel): Your Vercel URL
   - Admin Panel: `https://pos-admin-l9z6.vercel.app/dashboard`
3. **Place an order** in the POS app
4. **Check admin panel** - the order should appear immediately!

## Troubleshooting:

### Orders not appearing in admin panel?

1. **Check browser console** (F12) for connection logs:
   - Look for: `🌐 Using CLOUD server: https://pos-admin-l9z6.vercel.app`
   - Look for: `✅ Order synced to server`

2. **Check CORS settings** in your admin panel:
   - Make sure your admin panel allows requests from your POS app's Vercel domain
   - Add your POS app URL to CORS whitelist

3. **Verify API endpoints**:
   - Ensure your admin panel has `/api/orders` endpoint
   - Ensure `/api/health` endpoint returns 200 OK

4. **Check network tab**:
   - Open browser DevTools → Network tab
   - Place an order and check if POST request to `/api/orders` succeeds

### Still having issues?

- Check that both apps are deployed and accessible
- Verify the admin panel API is responding correctly
- Check browser console for specific error messages

## Support:

If you need help, check the `DEPLOYMENT.md` file for detailed instructions.
