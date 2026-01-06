// Configuration
const BACKEND_URL = 'http://localhost:3000'; // Change this after deploying backend
// For production: const BACKEND_URL = 'https://your-backend.onrender.com';

const statusDiv = document.getElementById('status');
const generateBtn = document.getElementById('generate');
const settingsBtn = document.getElementById('settings-btn');
const setupLink = document.getElementById('setup-link');
const profileAlert = document.getElementById('profile-alert');
const actionButtons = document.getElementById('action-buttons');
const copyAgainBtn = document.getElementById('copy-again');
const viewPreviewBtn = document.getElementById('view-preview');
const proposalPreview = document.getElementById('proposal-preview');
const proposalText = document.getElementById('proposal-text');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');

let lastGeneratedProposal = '';
let isPreviewVisible = false;

// Function to show toast notification
function showToast(message, isError = false) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Function to update status message
function updateStatus(message, type = 'normal', isLoading = false) {
  statusDiv.className = '';
  
  if (isLoading) {
    statusDiv.classList.add('loading');
    statusDiv.innerHTML = `<span class="spinner"></span>${message}`;
  } else {
    if (type === 'success') statusDiv.classList.add('success');
    if (type === 'error') statusDiv.classList.add('error');
    statusDiv.textContent = message;
  }
}

// Function to show/hide progress bar
function setProgress(percent) {
  if (percent === 0) {
    progressBar.classList.remove('show');
  } else {
    progressBar.classList.add('show');
    progressFill.style.width = `${percent}%`;
  }
}

// Function to calculate reading time (avg 200 words per minute)
function calculateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes;
}

// Function to update proposal stats
function updateProposalStats(text) {
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  const readTime = calculateReadingTime(text);
  
  document.getElementById('word-count').textContent = words;
  document.getElementById('char-count').textContent = chars;
  document.getElementById('read-time').textContent = readTime;
}

// Function to show proposal preview
function showProposalPreview(text) {
  lastGeneratedProposal = text;
  proposalText.textContent = text;
  updateProposalStats(text);
  
  // Enable action buttons
  copyAgainBtn.disabled = false;
  viewPreviewBtn.disabled = false;
  actionButtons.style.display = 'flex';
  
  // Auto-show preview briefly
  proposalPreview.classList.add('show');
  isPreviewVisible = true;
  viewPreviewBtn.textContent = '🙈 Hide Preview';
}

// Function to hide proposal preview
function hideProposalPreview() {
  proposalPreview.classList.remove('show');
  isPreviewVisible = false;
  viewPreviewBtn.textContent = '👁️ Preview';
}

// Toggle preview visibility
viewPreviewBtn.addEventListener('click', () => {
  if (isPreviewVisible) {
    hideProposalPreview();
  } else {
    proposalPreview.classList.add('show');
    isPreviewVisible = true;
    viewPreviewBtn.textContent = '🙈 Hide Preview';
  }
});

// Copy again button
copyAgainBtn.addEventListener('click', async () => {
  if (lastGeneratedProposal) {
    try {
      await copyToClipboard(lastGeneratedProposal);
      showToast('✅ Copied to clipboard again!');
      updateStatus('✅ Proposal re-copied to clipboard!', 'success');
    } catch (error) {
      showToast('❌ Failed to copy', true);
      updateStatus('❌ Failed to copy. Please try again.', 'error');
    }
  }
});

// Check if user has profile set up
async function checkProfileStatus() {
  try {
    const result = await chrome.storage.sync.get('userProfile');
    
    if (result.userProfile && result.userProfile.fullName && result.userProfile.summary) {
      // Profile exists and has required fields
      profileAlert.classList.remove('incomplete');
      profileAlert.classList.add('complete');
      profileAlert.innerHTML = `
        <span>✅ <strong>Profile: ${result.userProfile.fullName}</strong></span>
        <a class="setup-link" id="edit-link">Edit →</a>
      `;
      
      // Re-attach event listener after innerHTML change
      document.getElementById('edit-link').addEventListener('click', openSettings);
      return result.userProfile;
    } else {
      // No profile or incomplete
      profileAlert.classList.remove('complete');
      profileAlert.classList.add('incomplete');
      profileAlert.innerHTML = `
        <span>📝 <strong>No profile set up</strong></span>
        <a class="setup-link" id="setup-link-new">Set up now →</a>
      `;
      
      // Re-attach event listener
      document.getElementById('setup-link-new').addEventListener('click', openSettings);
      return null;
    }
  } catch (error) {
    console.error('Error checking profile:', error);
    return null;
  }
}

// Open settings page
function openSettings() {
  window.location.href = 'settings.html';
}

// Function to build user resume string from profile
function buildUserResume(profile) {
  if (!profile) return '';
  
  let resume = '';
  
  if (profile.fullName) {
    resume += `Name: ${profile.fullName}\n`;
  }
  
  if (profile.title) {
    resume += `Title: ${profile.title}\n`;
  }
  
  if (profile.experience) {
    resume += `Experience: ${profile.experience}\n`;
  }
  
  if (profile.skills) {
    resume += `\nKey Skills: ${profile.skills}\n`;
  }
  
  if (profile.summary) {
    resume += `\nProfessional Summary:\n${profile.summary}\n`;
  }
  
  if (profile.achievements) {
    resume += `\nNotable Projects/Achievements:\n${profile.achievements}\n`;
  }
  
  if (profile.certifications) {
    resume += `\nCertifications/Education: ${profile.certifications}\n`;
  }
  
  if (profile.portfolio) {
    resume += `\nPortfolio: ${profile.portfolio}\n`;
  }
  
  if (profile.email) {
    resume += `Contact: ${profile.email}\n`;
  }
  
  return resume;
}

// Function to get job description from the current tab
async function getJobDescription() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute content script to extract job description
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractJobDescription
    });
    
    return result[0].result;
  } catch (error) {
    console.error('Error getting job description:', error);
    throw new Error('Could not read job description from page. Make sure you\'re on a job posting page.');
  }
}

// This function runs in the context of the webpage
function extractJobDescription() {
  // IMPROVED EXTRACTION FOR UPWORK
  // Strategy: Try most specific selectors first, then fallback
  
  // Step 1: Try to find the main job description container
  const specificSelectors = [
    // Upwork job detail page - most specific
    'section[data-test="Description"]',
    'div[data-test="Description"]',
    'section.job-description',
    '[data-qa="job-details"]',
    '.air3-card-section[aria-label*="Description"]',
    
    // Upwork alternative selectors
    '.up-card-section:has(h2:contains("Description"))',
    'section:has(h2:contains("Description"))',
    
    // Fiverr
    '.gig-page-description',
    '.description-content',
    '.gig-description',
    
    // Freelancer
    '.project-detail',
    '.PageProjectViewLogout-projectInfo',
    '.project-description',
  ];
  
  // Try specific selectors first
  for (const selector of specificSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.innerText.length > 100) {
        console.log('Found job via selector:', selector);
        return element.innerText.trim();
      }
    } catch (e) {
      // Selector might use :has or :contains which aren't supported
      continue;
    }
  }
  
  // Step 2: Upwork-specific extraction using aria-label
  const sections = document.querySelectorAll('section');
  for (const section of sections) {
    const heading = section.querySelector('h2, h3');
    if (heading && (
      heading.innerText.toLowerCase().includes('description') ||
      heading.innerText.toLowerCase().includes('about')
    )) {
      const text = section.innerText;
      if (text.length > 100) {
        console.log('Found job via section heading');
        return text.trim();
      }
    }
  }
  
  // Step 3: Look for article or main content
  const mainContentSelectors = [
    'main article',
    'main',
    'article',
    '[role="main"]'
  ];
  
  for (const selector of mainContentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Get text but try to filter out navigation/sidebar
      let text = element.innerText;
      
      // If it's too long (> 15000 chars), it probably includes too much
      if (text.length > 15000) {
        // Try to get just the first major section
        const firstSection = element.querySelector('section');
        if (firstSection) {
          text = firstSection.innerText;
        }
      }
      
      if (text.length > 100) {
        console.log('Found job via main content:', selector);
        return text.substring(0, 5000).trim(); // Limit to 5000 chars
      }
    }
  }
  
  // Step 4: Last resort - body text but highly filtered
  console.warn('Using fallback extraction - results may be poor');
  return document.body.innerText.substring(0, 3000).trim();
}

// Function to call backend API with retry logic
async function generateProposal(jobDescription, userResume, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobDescription: jobDescription,
          userResume: userResume
        }),
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.proposal;
      
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt === retries) {
        // Last attempt failed
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      updateStatus(`⚠️ Retrying... (Attempt ${attempt + 2}/${retries + 1})`, 'normal', true);
    }
  }
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    throw error;
  }
}

// Enhanced error messages with troubleshooting
function getEnhancedErrorMessage(error) {
  const errorMsg = error.message || error.toString();
  
  if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
    return {
      message: '❌ Cannot connect to backend server',
      tip: 'Make sure the backend is running (npm start)',
      link: 'Check INSTALLATION.md for help'
    };
  }
  
  if (errorMsg.includes('Could not read job description')) {
    return {
      message: '❌ Could not find job description',
      tip: 'Make sure you\'re on the actual job posting page, not search results',
      link: null
    };
  }
  
  if (errorMsg.includes('API key')) {
    return {
      message: '❌ API key error',
      tip: 'Check that KINDO_API_KEY is set in backend .env file',
      link: 'See SETUP_GUIDE.md'
    };
  }
  
  if (errorMsg.includes('timeout')) {
    return {
      message: '❌ Request timed out',
      tip: 'The AI is taking too long. Try again in a moment.',
      link: null
    };
  }
  
  return {
    message: `❌ Error: ${errorMsg}`,
    tip: 'Try refreshing the page and generating again',
    link: 'Check console (F12) for details'
  };
}

// Function to display enhanced error
function displayEnhancedError(error) {
  const enhanced = getEnhancedErrorMessage(error);
  
  let html = enhanced.message;
  if (enhanced.tip) {
    html += `<br><small>💡 ${enhanced.tip}</small>`;
  }
  if (enhanced.link) {
    html += `<br><a href="#" class="troubleshooting-link" onclick="return false;">📖 ${enhanced.link}</a>`;
  }
  
  statusDiv.innerHTML = html;
  statusDiv.classList.add('error');
  
  showToast(enhanced.message, true);
}

// Main action when user clicks "Generate"
let isGenerating = false;

generateBtn.addEventListener('click', async () => {
  if (isGenerating) return; // Prevent multiple clicks
  
  try {
    isGenerating = true;
    generateBtn.disabled = true;
    hideProposalPreview(); // Hide previous preview
    setProgress(10);
    
    updateStatus('📖 Reading job description from page...', 'normal', true);
    
    // Step 1: Get user profile
    const profile = await checkProfileStatus();
    const userResume = buildUserResume(profile);
    setProgress(25);
    
    // Step 2: Get job description from page
    updateStatus('🔍 Extracting job requirements...', 'normal', true);
    const jobDescription = await getJobDescription();
    
    console.log('=== EXTRACTED JOB DESCRIPTION ===');
    console.log('Length:', jobDescription.length);
    console.log('First 200 chars:', jobDescription.substring(0, 200));
    console.log('=================================');
    
    if (!jobDescription || jobDescription.length < 100) {
      throw new Error('Could not find job description on this page. Make sure you\'re viewing a job posting.');
    }
    setProgress(40);
    
    // Step 3: Call backend to generate proposal
    updateStatus('🤖 AI is analyzing job and crafting your personalized proposal...', 'normal', true);
    setProgress(60);
    
    const proposal = await generateProposal(jobDescription, userResume);
    setProgress(85);
    
    if (!proposal || proposal.length < 50) {
      throw new Error('Generated proposal is too short. Please try again.');
    }
    
    // Step 4: Copy to clipboard
    updateStatus('📋 Copying to clipboard...', 'normal', true);
    await copyToClipboard(proposal);
    setProgress(100);
    
    // Step 5: Success!
    updateStatus('✅ Proposal copied to clipboard! Preview below or paste it now.', 'success');
    showToast('✅ Proposal ready! Copied to clipboard');
    showProposalPreview(proposal);
    
    // Hide progress bar after a moment
    setTimeout(() => setProgress(0), 1000);
    
  } catch (error) {
    console.error('Full error:', error);
    displayEnhancedError(error);
    setProgress(0);
    
    // Hide action buttons on error
    actionButtons.style.display = 'none';
    copyAgainBtn.disabled = true;
    viewPreviewBtn.disabled = true;
  } finally {
    isGenerating = false;
    generateBtn.disabled = false;
  }
});

// Settings button click
settingsBtn.addEventListener('click', openSettings);

// Setup link click
setupLink.addEventListener('click', openSettings);

// Check backend connection on load
async function checkBackendConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(BACKEND_URL, { 
      method: 'GET',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      updateStatus('✅ Ready to generate proposals', 'success');
    } else {
      updateStatus('⚠️ Backend connected but returned error. Check backend logs.', 'error');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      updateStatus('⚠️ Backend connection timeout. Make sure backend is running.', 'error');
    } else {
      const enhanced = getEnhancedErrorMessage(error);
      let html = '⚠️ Backend not connected. ';
      if (enhanced.tip) {
        html += `<br><small>💡 ${enhanced.tip}</small>`;
      }
      html += '<br><a href="#" class="troubleshooting-link" onclick="return false;">📖 See INSTALLATION.md for setup help</a>';
      statusDiv.innerHTML = html;
      statusDiv.classList.add('error');
    }
    console.error('Backend connection error:', error);
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + G to generate
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    if (!generateBtn.disabled) {
      generateBtn.click();
    }
  }
  
  // Ctrl/Cmd + , to open settings
  if ((e.ctrlKey || e.metaKey) && e.key === ',') {
    e.preventDefault();
    openSettings();
  }
});

// Initialize
async function init() {
  await checkProfileStatus();
  checkBackendConnection();
}

init();
