require('dotenv').config();
const { google } = require('googleapis');

async function testSheets() {
  try {
    // Set up authentication
    const auth = new google.auth.GoogleAuth({
      keyFile: './google-credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const authClient = await auth.getClient();
    
    const sheets = google.sheets({ 
      version: "v4", 
      auth: authClient
    });

    // Test reading from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sheet1!A1:D1'
    });
    
    console.log('Connected to Google Sheets successfully!');
    console.log('Headers:', response.data.values ? response.data.values[0] : 'No data found');

    // Test writing to the sheet
    const testWrite = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Test Name', 'test@email.com', '1234567890', 'https://test-cv-link.pdf']]
      }
    });

    console.log('Test write successful:', testWrite.status === 200);

  } catch (error) {
    console.error('Failed to connect to Google Sheets:', error.message);
    console.error('Error details:', error);
  }
}

testSheets(); 