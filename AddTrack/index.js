const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid'); // Ensure you have 'uuid' module available in your deployment package

exports.handler = async (event) => {
    const { title, artist, album, fileContentBase64, fileName } = JSON.parse(event.body);
    const trackId = uuidv4(); // Generate a unique ID for the track

    // Define S3 upload parameters
    const s3Params = {
        Bucket: 'vot-music-bucket', // Your S3 Bucket name
        Key: `tracks/${trackId}/${fileName}`, // File path in S3
        Body: Buffer.from(fileContentBase64, 'base64'), // Decode base64 file
        ContentType: 'audio/mpeg', // Adjust depending on the file type
    };

    try {
        // Attempt to upload the file to S3
        await s3.putObject(s3Params).promise();

        // Define DynamoDB put parameters
        const dbParams = {
            TableName: 'TracksTable',
            Item: {
                TrackID: trackId,
                Title: title,
                Artist: artist,
                Album: album,
                // Add URLs or other necessary attributes
                // For example, constructing the S3 URL. Ensure the URL structure matches your S3 bucket configuration
                AudioFileURL: `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`
            }
        };

        // Attempt to add the track metadata to DynamoDB
        await dynamoDB.put(dbParams).promise();

        return { statusCode: 200, body: JSON.stringify({ message: 'Track added successfully!', trackId: trackId }) };
    } catch (error) {
        console.error('Error adding track:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to add track', error: error.message }) };
    }
};
