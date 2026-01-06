const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and increase payload limits
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'QuickBid AI Backend is running!' });
});

// Generate proposals
app.post('/api/generate-proposal', async (req, res) => {
  try {
    const { jobDescription, userResume } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }
    if (!process.env.KINDO_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://llm.kindo.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KINDO_API_KEY}`
      },
      body: JSON.stringify({
        model: 'azure/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert freelance proposal writer. Match proposals to specific job requirements. Keep 150-250 words, professional tone.'
          },
          {
            role: 'user',
            content: `Job: ${jobDescription}\n\n${userResume ? `Background: ${userResume}\n\n` : ''}Write a focused proposal.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: 'Failed to generate proposal', details: errorData });
    }

    const data = await response.json();
    res.json({ proposal: data.choices[0].message.content, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Parse resume
app.post('/api/parse-resume', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || resumeText.length < 100) {
      return res.status(400).json({ error: 'Resume text required (min 100 chars)' });
    }
    if (!process.env.KINDO_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Parsing resume... Length:', resumeText.length);

    const response = await fetch('https://llm.kindo.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KINDO_API_KEY}`
      },
      body: JSON.stringify({
        model: 'azure/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Extract resume data as JSON: fullName, email, portfolio, title, experience, skills, summary, achievements, certifications'
          },
          {
            role: 'user',
            content: `Parse: ${resumeText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: 'Failed to parse', details: errorData });
    }

    const data = await response.json();
    const parsedData = JSON.parse(data.choices[0].message.content);
    console.log('✅ Parsed successfully');
    res.json({ profile: parsedData, success: true });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Parse failed', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📡 Endpoints: /api/generate-proposal, /api/parse-resume`);
  console.log(process.env.KINDO_API_KEY ? '✅ API key loaded' : '⚠️ API key missing');
});
