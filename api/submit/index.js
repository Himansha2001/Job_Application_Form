const express = require('express');
const serverless = require('serverless-http');
const multer = require('multer');
const { google } = require('googleapis');
const AWS = require('aws-sdk');
const cors = require('cors');
const pdfjsLib = require('pdfjs-dist');
const mammoth = require('mammoth');
const nodemailer = require('nodemailer');

// Initialize express app
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Google Sheets API setup with OAuth2
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: "v4", auth: auth });
const spreadsheetId = process.env.SPREADSHEET_ID;

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to extract CV content
async function extractCVContent(file) {
  const content = {
    education: [],
    qualifications: [],
    projects: [],
    personal_info: {}
  };

  try {
    if (file.mimetype === 'application/pdf') {
      const uint8Array = new Uint8Array(file.buffer);
      const data = await pdfjsLib.getDocument(uint8Array).promise;
      const numPages = data.numPages;
      let text = '';
      
      for (let i = 1; i <= numPages; i++) {
        const page = await data.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ');
      }

      const educationMatch = text.match(/Education(?:[\s\S]*?)(?=Experience|Skills|Projects|$)/i);
      if (educationMatch) content.education = [educationMatch[0].trim()];

      const qualificationsMatch = text.match(/(?:Qualifications|Skills)(?:[\s\S]*?)(?=Experience|Education|Projects|$)/i);
      if (qualificationsMatch) content.qualifications = [qualificationsMatch[0].trim()];

      const projectsMatch = text.match(/Projects(?:[\s\S]*?)(?=Education|Experience|Skills|$)/i);
      if (projectsMatch) content.projects = [projectsMatch[0].trim()];

    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      const text = result.value;

      const educationMatch = text.match(/Education(?:[\s\S]*?)(?=Experience|Skills|Projects|$)/i);
      if (educationMatch) content.education = [educationMatch[0].trim()];

      const qualificationsMatch = text.match(/(?:Qualifications|Skills)(?:[\s\S]*?)(?=Experience|Education|Projects|$)/i);
      if (qualificationsMatch) content.qualifications = [qualificationsMatch[0].trim()];

      const projectsMatch = text.match(/Projects(?:[\s\S]*?)(?=Education|Experience|Skills|$)/i);
      if (projectsMatch) content.projects = [projectsMatch[0].trim()];
    }

    return content;
  } catch (error) {
    console.error('Error extracting CV content:', error);
    return content;
  }
}

// Main handler function
const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use multer to handle file upload
    upload.single('cv')(req, res, async function(err) {
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({ error: 'File upload failed', message: err.message });
      }

      const { name, email, phone } = req.body;
      const cvFile = req.file;

      if (!name || !email || !phone || !cvFile) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide name, email, phone and CV file'
        });
      }

      try {
        // Upload to S3
        const cvFileName = `${Date.now()}_${encodeURIComponent(cvFile.originalname)}`;
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: cvFileName,
          Body: cvFile.buffer,
          ContentType: cvFile.mimetype,
          Metadata: {
            'originalname': cvFile.originalname,
            'uploadedby': email
          }
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        const cvPublicLink = await s3.getSignedUrlPromise('getObject', {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: cvFileName,
          Expires: 604800
        });

        // Extract CV content
        const cvContent = await extractCVContent(cvFile);
        cvContent.personal_info = { name, email, phone };

        // Update Google Sheet
        const authClient = await auth.getClient();
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Sheet1!A1",
          valueInputOption: "RAW",
          requestBody: {
            values: [[
              name,
              email,
              phone,
              cvPublicLink,
              JSON.stringify(cvContent.education),
              JSON.stringify(cvContent.qualifications),
              JSON.stringify(cvContent.projects)
            ]]
          },
          auth: authClient
        });

        // Send success response
        res.status(200).json({
          success: true,
          message: "Application processed successfully!",
          applicationId: cvFileName.split('_')[0],
          cvUrl: cvPublicLink
        });

      } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({
          error: 'Application processing failed',
          message: error.message || 'An unexpected error occurred'
        });
      }
    });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
};

// Export the serverless function
module.exports = handler; 