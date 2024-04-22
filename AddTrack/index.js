const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Extract bucket name and key from the first record
    console.log('Event:', JSON.stringify(event, null, 2));  // Log the event structure
    const bucketName = event.Records[0].s3.bucket.name;
    const objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    console.log(`File uploaded in bucket: ${bucketName}, with key: ${objectKey}`);


    try {
        const s3Params = {
            Bucket: bucketName,
            Key: objectKey
        };

        // Get the object from S3
        const s3Data = await s3.getObject(s3Params).promise();
        const fileContent = s3Data.Body; // This is a buffer

        const trackId = objectKey.split('/')[1]; // Assuming the track ID is part of the object key

        // Define parameters for DynamoDB
        const dbParams = {
            TableName: 'TracksTable',
            Item: {
                TrackID: trackId,
                S3Bucket: bucketName,
                S3Key: objectKey
            }
        };

        // Put item in DynamoDB
        await dynamoDB.put(dbParams).promise();
        console.log('Metadata added successfully.');

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Track added successfully', trackId: trackId })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to add the track', error: error.message })
        };
    }
};

