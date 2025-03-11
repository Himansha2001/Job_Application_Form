require('dotenv').config();
const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const AWS = require('aws-sdk');
const axios = require("axios");
const cors = require("cors");
const pdfjsLib = require('pdfjs-dist');
const mammoth = require('mammoth');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');

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

const sheets = google.sheets({ 
  version: "v4", 
  auth: auth
});

const spreadsheetId = process.env.SPREADSHEET_ID;

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Add CORS middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  credentials: true
}));

// Serve static files
app.use(express.static('public'));

// Root route handler
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Health check route
app.get('/api/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
});

// Add this function to extract CV content
async function extractCVContent(file) {
  const content = {
    education: [],
    qualifications: [],
    projects: [],
    personal_info: {}
  };

  try {
    if (file.mimetype === 'application/pdf') {
      // Convert Buffer to Uint8Array for PDF.js
      const uint8Array = new Uint8Array(file.buffer);
      
      // Load PDF
      const data = await pdfjsLib.getDocument(uint8Array).promise;
      const numPages = data.numPages;
      let text = '';
      
      // Extract text from all pages
      for (let i = 1; i <= numPages; i++) {
        const page = await data.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ');
      }

      // Extract sections using regex
      const educationMatch = text.match(/Education(?:[\s\S]*?)(?=Experience|Skills|Projects|$)/i);
      if (educationMatch) content.education = [educationMatch[0].trim()];

      const qualificationsMatch = text.match(/(?:Qualifications|Skills)(?:[\s\S]*?)(?=Experience|Education|Projects|$)/i);
      if (qualificationsMatch) content.qualifications = [qualificationsMatch[0].trim()];

      const projectsMatch = text.match(/Projects(?:[\s\S]*?)(?=Education|Experience|Skills|$)/i);
      if (projectsMatch) content.projects = [projectsMatch[0].trim()];

    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Handle DOCX
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      const text = result.value;

      // Extract sections using regex
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

// Function to send immediate confirmation email
async function sendConfirmationEmail(applicantEmail, name) {
  try {
    const result = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: applicantEmail,
      subject: 'Application Received - Thank You!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2c3e50;">Hello ${name},</h2>
          
          <p>Thank you for submitting your job application. This email confirms that we have received your application and CV.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">What's Next?</h3>
            <ul style="list-style-type: none; padding-left: 0;">
              <li style="margin-bottom: 10px;">✓ Our team will review your application</li>
              <li style="margin-bottom: 10px;">✓ You'll receive a follow-up email tomorrow with more details</li>
              <li style="margin-bottom: 10px;">✓ We'll contact you if we need any additional information</li>
            </ul>
          </div>

          <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
          
          <div style="margin-top: 30px;">
            <p style="margin-bottom: 5px;">Best regards,</p>
            <p style="margin-top: 0;"><strong>${process.env.EMAIL_FROM_NAME}</strong></p>
          </div>
        </div>
      `
    });
    console.log('Confirmation email sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

// Function to send follow-up email
async function sendFollowUpEmail(applicantEmail, name) {
  try {
    const result = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: applicantEmail,
      subject: 'Your Application Status Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2c3e50;">Hello ${name},</h2>
          
          <p>We hope this email finds you well. We wanted to provide you with an update regarding your recent job application.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Application Status</h3>
            <p>Our team is currently reviewing your application and CV. We are impressed with your interest in joining our team.</p>
          </div>

          <div style="margin: 20px 0;">
            <p>What you can expect next:</p>
            <ul>
              <li>Detailed review of your qualifications</li>
              <li>Potential invitation for an interview</li>
              <li>Further communication about next steps</li>
            </ul>
          </div>

          <p>We appreciate your patience during our review process. If you have any questions or need to update your application, please don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px;">
            <p style="margin-bottom: 5px;">Best regards,</p>
            <p style="margin-top: 0;"><strong>${process.env.EMAIL_FROM_NAME}</strong></p>
          </div>
        </div>
      `
    });
    console.log('Follow-up email sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending follow-up email:', error);
    throw error;
  }
}

// Schedule follow-up email
function scheduleFollowUpEmail(applicantEmail, name) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  schedule.scheduleJob(tomorrow, async function() {
    try {
      await sendFollowUpEmail(applicantEmail, name);
    } catch (error) {
      console.error('Error in scheduled follow-up email:', error);
    }
  });
  console.log(`Follow-up email scheduled for ${tomorrow}`);
}

// Endpoint to handle form submission
app.post("/submit", upload.single("cv"), async (req, res) => {
  console.log('Starting form submission process...');
  const { name, email, phone } = req.body;
  const cvFile = req.file;

  // Validate input
  if (!name || !email || !phone || !cvFile) {
    console.error('Missing required fields:', { name, email, phone, hasFile: !!cvFile });
    return res.status(400).json({
      error: 'Missing required fields',
      details: 'Please provide name, email, phone and CV file'
    });
  }

  try {
    // Upload CV to AWS S3
    console.log('Step 1: Uploading file to AWS S3...');
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

    let cvPublicLink;
    try {
      console.log('Initiating S3 upload...');
      const uploadResult = await s3.upload(uploadParams).promise();
      
      // Generate a pre-signed URL that's valid for 7 days
      const signedUrlParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: cvFileName,
        Expires: 604800 // URL expires in 7 days (7 * 24 * 60 * 60 seconds)
      };
      
      cvPublicLink = await s3.getSignedUrlPromise('getObject', signedUrlParams);
      console.log('S3 upload successful, signed URL generated:', cvPublicLink);
    } catch (uploadError) {
      console.error('AWS S3 upload error:', uploadError);
      throw new Error(`Failed to upload CV file: ${uploadError.message}`);
    }

    // Extract CV content
    console.log('Step 2: Extracting CV content...');
    const cvContent = await extractCVContent(cvFile);
    console.log('CV content extracted successfully');
    cvContent.personal_info = {
      name,
      email,
      phone
    };

    // Append data to Google Sheet
    console.log('Step 3: Updating Google Sheet...');
    try {
      console.log('Getting Google auth client...');
      const authClient = await auth.getClient();
      console.log('Auth client obtained, updating sheet...');
      const sheetResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
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
      console.log('Google Sheet updated successfully:', sheetResponse.status);
    } catch (sheetError) {
      console.error('Google Sheets API error:', sheetError);
      throw new Error(`Failed to update application records: ${sheetError.message}`);
    }

    // Send webhook notification
    console.log('Step 4: Sending webhook notification...');
    try {
      const webhookPayload = {
        cv_data: {
          personal_info: {
            name,
            email,
            phone
          },
          education: cvContent.education || [],
          qualifications: cvContent.qualifications || [],
          projects: cvContent.projects || [],
          cv_public_link: cvPublicLink
        },
        metadata: {
          applicant_name: name,
          email: email,
          status: "prod",
          cv_processed: true,
          processed_timestamp: new Date().toISOString()
        }
      };

      console.log('Sending production webhook payload:', JSON.stringify(webhookPayload, null, 2));
      const webhookResponse = await axios.post(
        "https://rnd-assignment.automations-3d6.workers.dev/",
        webhookPayload,
        {
          headers: { 
            "X-Candidate-Email": "himanshahishan@gmail.com",
            "Content-Type": "application/json"
          },
          timeout: 5000
        }
      );
      console.log('Webhook notification sent successfully:', webhookResponse.status);
    } catch (webhookError) {
      console.error('Webhook notification error:', webhookError.response?.data || webhookError.message);
      // Don't throw here - webhook failure shouldn't fail the whole application
    }

    // Send immediate confirmation email
    console.log('Sending confirmation email...');
    await sendConfirmationEmail(email, name);

    // Schedule follow-up email
    console.log('Scheduling follow-up email...');
    scheduleFollowUpEmail(email, name);

    console.log('All steps completed successfully');
    res.status(200).json({
      success: true,
      message: "Application processed successfully!",
      applicationId: cvFileName.split('_')[0],
      cvUrl: cvPublicLink
    });

  } catch (error) {
    console.error("Error processing application:", error);
    res.status(500).json({
      error: 'Application processing failed',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Server error',
    message: 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
  } else {
    console.error('Error starting server:', err);
  }
  process.exit(1);
});