require('dotenv').config();
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function testAWS() {
  try {
    const buckets = await s3.listBuckets().promise();
    console.log('Connected to AWS S3 successfully!');
    console.log('Available buckets:', buckets.Buckets.map(bucket => bucket.Name));
  } catch (error) {
    console.error('Failed to connect to AWS S3:', error);
  }
}

testAWS(); 