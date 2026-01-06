const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your Chrome extension
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'QuickBid AI Backend is running!' });
});

// Main endpoint to generate proposals
app.post('/api/generate-proposal', async (req, res) => {
  try {
    const { jobDescription, userResume } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Call Kindo AI API
    const response = await fetch('https://api.kindo.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.KINDO_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4', // Change this to your preferred model
        messages: [
          {
            role: 'system',
            content: `You are an expert freelance proposal writer. Your job is to analyze job descriptions and create compelling, personalized proposals that highlight relevant skills and experience. Keep proposals professional, concise (150-250 words), and include:
1. A hook that shows you understand their specific need
2. 2-3 relevant qualifications or past experiences
3. A brief approach to solving their problem
4. A confident closing`
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\n${userResume ? `My Background:\n${userResume}\n\n` : ''}Write a personalized freelance proposal for this job.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Kindo API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to generate proposal', 
        details: errorData 
      });
    }

    const data = await response.json();
    const proposal = data.choices[0].message.content;

    res.json({ 
      proposal,
      success: true 
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 QuickBid AI Backend running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/generate-proposal`);
});
