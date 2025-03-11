# Job Application Form

A full-stack application for processing job applications with CV upload, data extraction, and automated email notifications.

## Features

- Modern, responsive UI with drag-and-drop CV upload
- CV processing and data extraction (PDF and DOCX support)
- AWS S3 integration for CV storage
- Google Sheets integration for application tracking
- Automated email notifications (confirmation and follow-up)
- Webhook integration for application processing status
- Production-ready with Vercel deployment support

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Storage**: AWS S3
- **Database**: Google Sheets API
- **File Processing**: PDF.js, Mammoth.js
- **Email**: Nodemailer
- **Deployment**: Vercel

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Himansha2001/Job_Application_Form.git
cd job-application-form
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name
SPREADSHEET_ID=your_google_sheet_id
EMAIL_USER=your_email
EMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM_NAME=your_name
```

4. Add your Google Sheets credentials:
- Save your Google credentials as `google-credentials.json`
- Or set up `GOOGLE_CREDENTIALS_BASE64` in environment variables

5. Run the application:
```bash
npm start
```

## Deployment

The application is configured for Vercel deployment with the following features:
- Serverless functions
- Static file serving
- Environment variable management
- Automatic HTTPS
- Global CDN

## API Endpoints

- `POST /submit`: Handle form submissions
- `GET /api/health`: Health check endpoint
- `GET /`: Serve the main application

## Security Features

- Secure file upload handling
- Environment variable protection
- CORS configuration
- Error handling and logging
- Rate limiting (in production)

## License

MIT License

## Author

Himansha Hishan

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# Job Application Processing System

## Tech Stack & Services

### Frontend
- HTML5, CSS3, JavaScript
- Modern UI with drag-and-drop support
- Progress indicators and responsive design

### Backend
- Node.js with Express
- PDF.js and Mammoth for document parsing
- Node-schedule for email scheduling

### Cloud Services
- AWS S3 for CV storage
- Google Sheets API for data storage
- Gmail SMTP for email notifications

## Architecture
