require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  projectId: 'your-project-id',
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE
});

async function testStorage() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Connected to Google Cloud Storage successfully!');
    console.log('Available buckets:', buckets.map(bucket => bucket.name));
  } catch (error) {
    console.error('Failed to connect to Google Cloud Storage:', error);
  }
}

testStorage(); 