// Settings page logic

const form = document.getElementById('profile-form');
const backBtn = document.getElementById('back-btn');
const clearBtn = document.getElementById('clear-btn');
const statusDiv = document.getElementById('status');
const summaryTextarea = document.getElementById('summary');
const charCount = document.getElementById('char-count');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Resume upload elements
const uploadArea = document.getElementById('upload-area');
const resumeFileInput = document.getElementById('resume-file');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const removeFileBtn = document.getElementById('remove-file');
const parseResumeBtn = document.getElementById('parse-resume');

// Tab switching
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

let uploadedFile = null;

// Tab switching logic
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    
    // Update active tab
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Update active content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// Get all input fields
const inputs = form.querySelectorAll('input, textarea');

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

// Function to show/hide loading overlay
function setLoading(isLoading, message = 'Processing...') {
  if (isLoading) {
    loadingText.textContent = message;
    loadingOverlay.classList.add('show');
  } else {
    loadingOverlay.classList.remove('show');
  }
}

// Mark inputs as touched for validation styling
inputs.forEach(input => {
  input.addEventListener('blur', () => {
    input.classList.add('touched');
  });
  
  input.addEventListener('input', () => {
    if (input.value.length > 0) {
      input.classList.add('touched');
    }
  });
});

// Update character count with better feedback
summaryTextarea.addEventListener('input', () => {
  const count = summaryTextarea.value.length;
  charCount.textContent = `${count} characters`;
  
  if (count === 0) {
    charCount.style.color = '#7f8c8d';
  } else if (count < 100) {
    charCount.style.color = '#e74c3c';
    charCount.textContent = `${count} characters (minimum 100)`;
  } else if (count < 200) {
    charCount.style.color = '#f39c12';
    charCount.textContent = `${count} characters (good, but 200+ recommended)`;
  } else if (count <= 500) {
    charCount.style.color = '#27ae60';
    charCount.textContent = `${count} characters (perfect! ✓)`;
  } else {
    charCount.style.color = '#3498db';
    charCount.textContent = `${count} characters (comprehensive!)`;
  }
});

// ============================================
// RESUME UPLOAD FUNCTIONALITY
// ============================================

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelect(files[0]);
  }
});

// File input click
uploadArea.addEventListener('click', () => {
  resumeFileInput.click();
});

resumeFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

// Handle file selection
function handleFileSelect(file) {
  // Validate file type
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];
  
  if (!validTypes.includes(file.type)) {
    showToast('❌ Please upload a PDF, DOCX, DOC, or TXT file', true);
    return;
  }
  
  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showToast('❌ File too large. Maximum size is 5MB', true);
    return;
  }
  
  uploadedFile = file;
  
  // Update UI
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileInfo.classList.add('show');
  parseResumeBtn.disabled = false;
  
  showToast(`✓ ${file.name} ready to parse`, false);
}

// Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Remove file
removeFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  uploadedFile = null;
  fileInfo.classList.remove('show');
  parseResumeBtn.disabled = true;
  resumeFileInput.value = '';
  showToast('File removed', false);
});

// Parse resume button
parseResumeBtn.addEventListener('click', async () => {
  if (!uploadedFile) {
    showToast('❌ No file selected', true);
    return;
  }
  
  try {
    setLoading(true, 'Reading and parsing resume...');
    
    // Read file as text
    const fileText = await readFileAsText(uploadedFile);
    
    if (!fileText || fileText.length < 100) {
      throw new Error('File appears to be empty or too short');
    }
    
    // Send to backend for AI parsing
    const parsed = await parseResumeWithAI(fileText);
    
    // Fill form with parsed data
    if (parsed.fullName) document.getElementById('fullName').value = parsed.fullName;
    if (parsed.email) document.getElementById('email').value = parsed.email;
    if (parsed.portfolio) document.getElementById('portfolio').value = parsed.portfolio;
    if (parsed.title) document.getElementById('title').value = parsed.title;
    if (parsed.experience) document.getElementById('experience').value = parsed.experience;
    if (parsed.skills) document.getElementById('skills').value = parsed.skills;
    if (parsed.summary) document.getElementById('summary').value = parsed.summary;
    if (parsed.achievements) document.getElementById('achievements').value = parsed.achievements;
    if (parsed.certifications) document.getElementById('certifications').value = parsed.certifications;
    
    // Update character count
    summaryTextarea.dispatchEvent(new Event('input'));
    
    // Switch to manual tab to review
    document.querySelector('[data-tab="manual"]').click();
    
    setLoading(false);
    showToast('✅ Resume parsed! Review and edit below, then save');
    showStatus('✅ Resume data extracted. Please review and edit as needed, then save.', 'success');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Error parsing resume:', error);
    setLoading(false);
    showToast('❌ Failed to parse resume: ' + error.message, true);
    showStatus('❌ Failed to parse resume. Try manual entry or check file format.', 'error');
  }
});

// Read PDF file and extract text
async function readFileAsText(file) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if it's a PDF
      if (file.type === 'application/pdf') {
        // Use PDF.js to extract text
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        
        resolve(fullText);
      } else {
        // For non-PDF files, use regular text reader
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      }
    } catch (error) {
      reject(error);
    }
  });
}


// Parse resume with AI (backend call)
async function parseResumeWithAI(resumeText) {
  const BACKEND_URL = 'https://quickbid-ai-backend.onrender.com'; 
  const response = await fetch(`${BACKEND_URL}/api/parse-resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resumeText: resumeText
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to parse resume');
  }
  
  const data = await response.json();
  return data.profile;
}

// ============================================
// AUTO-SAVE DRAFT FUNCTIONALITY
// ============================================

// Auto-save draft to prevent data loss
let autoSaveTimeout;
function autoSaveDraft() {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(async () => {
    const draftData = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      portfolio: document.getElementById('portfolio').value.trim(),
      title: document.getElementById('title').value.trim(),
      experience: document.getElementById('experience').value.trim(),
      skills: document.getElementById('skills').value.trim(),
      summary: document.getElementById('summary').value.trim(),
      achievements: document.getElementById('achievements').value.trim(),
      certifications: document.getElementById('certifications').value.trim(),
    };
    
    // Only save if there's some content
    if (Object.values(draftData).some(val => val.length > 0)) {
      try {
        await chrome.storage.local.set({ profileDraft: draftData });
        console.log('Draft auto-saved');
      } catch (error) {
        console.error('Failed to auto-save draft:', error);
      }
    }
  }, 2000); // Save 2 seconds after user stops typing
}

// Add auto-save listeners
inputs.forEach(input => {
  input.addEventListener('input', autoSaveDraft);
});

// ============================================
// LOAD PROFILE OR DRAFT
// ============================================

// Load saved profile or draft on page load
async function loadProfile() {
  try {
    setLoading(true, 'Loading profile...');
    
    // First try to load actual profile
    const result = await chrome.storage.sync.get('userProfile');
    
    if (result.userProfile) {
      const profile = result.userProfile;
      document.getElementById('fullName').value = profile.fullName || '';
      document.getElementById('email').value = profile.email || '';
      document.getElementById('portfolio').value = profile.portfolio || '';
      document.getElementById('title').value = profile.title || '';
      document.getElementById('experience').value = profile.experience || '';
      document.getElementById('skills').value = profile.skills || '';
      document.getElementById('summary').value = profile.summary || '';
      document.getElementById('achievements').value = profile.achievements || '';
      document.getElementById('certifications').value = profile.certifications || '';
      
      // Update character count
      summaryTextarea.dispatchEvent(new Event('input'));
      
      // Mark filled fields as touched
      inputs.forEach(input => {
        if (input.value.length > 0) {
          input.classList.add('touched');
        }
      });
    } else {
      // Try to load draft if no profile exists
      const draftResult = await chrome.storage.local.get('profileDraft');
      if (draftResult.profileDraft) {
        const draft = draftResult.profileDraft;
        document.getElementById('fullName').value = draft.fullName || '';
        document.getElementById('email').value = draft.email || '';
        document.getElementById('portfolio').value = draft.portfolio || '';
        document.getElementById('title').value = draft.title || '';
        document.getElementById('experience').value = draft.experience || '';
        document.getElementById('skills').value = draft.skills || '';
        document.getElementById('summary').value = draft.summary || '';
        document.getElementById('achievements').value = draft.achievements || '';
        document.getElementById('certifications').value = draft.certifications || '';
        
        summaryTextarea.dispatchEvent(new Event('input'));
        
        showToast('📝 Draft restored', false);
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showStatus('⚠️ Could not load profile data', 'error');
  } finally {
    setLoading(false);
  }
}

// ============================================
// FORM VALIDATION
// ============================================

// Validate form with better feedback
function validateForm(profile) {
  const errors = [];
  
  if (!profile.fullName || profile.fullName.length < 2) {
    errors.push('Full Name is required (at least 2 characters)');
    document.getElementById('fullName').classList.add('touched');
  }
  
  if (!profile.title || profile.title.length < 3) {
    errors.push('Professional Title is required (at least 3 characters)');
    document.getElementById('title').classList.add('touched');
  }
  
  if (!profile.summary || profile.summary.length < 100) {
    errors.push('Professional Summary must be at least 100 characters');
    document.getElementById('summary').classList.add('touched');
  }
  
  if (profile.email && !isValidEmail(profile.email)) {
    errors.push('Email format is invalid');
    document.getElementById('email').classList.add('touched');
  }
  
  if (profile.portfolio && !isValidURL(profile.portfolio)) {
    errors.push('Portfolio URL format is invalid');
    document.getElementById('portfolio').classList.add('touched');
  }
  
  return errors;
}

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// URL validation
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// SAVE PROFILE
// ============================================

// Save profile
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const profile = {
    fullName: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    portfolio: document.getElementById('portfolio').value.trim(),
    title: document.getElementById('title').value.trim(),
    experience: document.getElementById('experience').value.trim(),
    skills: document.getElementById('skills').value.trim(),
    summary: document.getElementById('summary').value.trim(),
    achievements: document.getElementById('achievements').value.trim(),
    certifications: document.getElementById('certifications').value.trim(),
    lastUpdated: new Date().toISOString()
  };
  
  // Validation
  const errors = validateForm(profile);
  if (errors.length > 0) {
    showStatus(`❌ ${errors[0]}`, 'error');
    showToast(errors[0], true);
    
    // Focus first invalid field
    const firstInvalidField = form.querySelector('.touched:invalid');
    if (firstInvalidField) {
      firstInvalidField.focus();
    }
    return;
  }
  
  try {
    setLoading(true, 'Saving profile...');
    
    // Save to sync storage
    await chrome.storage.sync.set({ userProfile: profile });
    
    // Clear draft after successful save
    await chrome.storage.local.remove('profileDraft');
    
    setLoading(false);
    
    showStatus('✅ Profile saved successfully!', 'success');
    showToast('✅ Profile saved! Your proposals will now be personalized');
    
    // Smooth scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
    
    // Optional: Vibrate on mobile (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
  } catch (error) {
    console.error('Error saving profile:', error);
    setLoading(false);
    
    if (error.message.includes('QUOTA_BYTES')) {
      showStatus('❌ Profile too large. Try shortening your summary or achievements.', 'error');
      showToast('❌ Profile too large to save', true);
    } else {
      showStatus('❌ Failed to save profile. Please try again.', 'error');
      showToast('❌ Save failed. Please try again.', true);
    }
  }
});

// ============================================
// CLEAR PROFILE
// ============================================

// Clear profile with confirmation
clearBtn.addEventListener('click', async () => {
  const hasContent = Array.from(inputs).some(input => input.value.trim().length > 0);
  
  if (!hasContent) {
    showToast('ℹ️ Profile is already empty', false);
    return;
  }
  
  const confirmMessage = 'Are you sure you want to clear your entire profile? This cannot be undone.';
  
  if (confirm(confirmMessage)) {
    try {
      setLoading(true, 'Clearing profile...');
      
      await chrome.storage.sync.remove('userProfile');
      await chrome.storage.local.remove('profileDraft');
      
      form.reset();
      charCount.textContent = '0 characters';
      charCount.style.color = '#7f8c8d';
      
      // Remove touched class from all inputs
      inputs.forEach(input => input.classList.remove('touched'));
      
      // Clear uploaded file
      uploadedFile = null;
      fileInfo.classList.remove('show');
      parseResumeBtn.disabled = true;
      resumeFileInput.value = '';
      
      setLoading(false);
      
      showStatus('🗑️ Profile cleared successfully', 'success');
      showToast('🗑️ Profile cleared');
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
      
    } catch (error) {
      console.error('Error clearing profile:', error);
      setLoading(false);
      showStatus('❌ Failed to clear profile', 'error');
      showToast('❌ Failed to clear profile', true);
    }
  }
});

// ============================================
// BACK BUTTON
// ============================================

// Back button with unsaved changes warning
backBtn.addEventListener('click', async () => {
  // Check if there are unsaved changes
  const currentData = {
    fullName: document.getElementById('fullName').value.trim(),
    title: document.getElementById('title').value.trim(),
    summary: document.getElementById('summary').value.trim(),
  };
  
  let hasUnsavedChanges = false;
  
  try {
    const result = await chrome.storage.sync.get('userProfile');
    if (result.userProfile) {
      const saved = result.userProfile;
      hasUnsavedChanges = (
        currentData.fullName !== (saved.fullName || '') ||
        currentData.title !== (saved.title || '') ||
        currentData.summary !== (saved.summary || '')
      );
    } else {
      // If no saved profile, check if user has entered anything
      hasUnsavedChanges = Object.values(currentData).some(val => val.length > 0);
    }
  } catch (error) {
    console.error('Error checking for changes:', error);
  }
  
  if (hasUnsavedChanges) {
    if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
      window.location.href = 'popup.html';
    }
  } else {
    window.location.href = 'popup.html';
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = type;
  statusDiv.style.display = 'block';
  
  // Auto-scroll to status
  statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
  
  // Escape to go back
  if (e.key === 'Escape') {
    backBtn.click();
  }
});

// ============================================
// INITIALIZE
// ============================================

loadProfile();
