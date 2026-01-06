# QuickBid AI Backend

Secure backend server for the QuickBid AI Chrome Extension that generates personalized freelance proposals using Kindo AI.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your Kindo API key:
```
KINDO_API_KEY=your_actual_kindo_api_key
PORT=3000
```

### 3. Run Locally
```bash
npm start
```

Or with auto-reload during development:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### `POST /api/generate-proposal`
Generates a personalized freelance proposal from a job description.

**Request Body:**
```json
{
  "jobDescription": "We need a React developer to build...",
  "userResume": "Optional: Your background/skills"
}
```

**Response:**
```json
{
  "proposal": "Generated proposal text...",
  "success": true
}
```

## 🌐 Deployment Options

### Option 1: Render.com (Recommended - Free Tier)
1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** Add `KINDO_API_KEY`
5. Deploy!

### Option 2: Railway.app
1. Visit [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select this repo
4. Add environment variable: `KINDO_API_KEY`
5. Deploy!

### Option 3: Vercel
```bash
npm install -g vercel
vercel
```

### Option 4: Azure Web Apps
```bash
az webapp up --name quickbid-backend --runtime "NODE:18-lts"
az webapp config appsettings set --settings KINDO_API_KEY=your_key
```

## 🔒 Security Notes

- ✅ API key is stored server-side only
- ✅ CORS enabled for Chrome extension
- ✅ `.env` file is gitignored
- ⚠️ Add rate limiting for production use
- ⚠️ Consider adding authentication if scaling

## 🧪 Testing

Test the endpoint with curl:
```bash
curl -X POST http://localhost:3000/api/generate-proposal \
  -H "Content-Type: application/json" \
  -d '{"jobDescription":"Build a React app"}'
```

## 📝 Next Steps

1. Deploy this backend to a hosting service
2. Update your Chrome extension's `popup.js` with the deployed URL
3. Test end-to-end flow
4. Add usage analytics/monitoring
