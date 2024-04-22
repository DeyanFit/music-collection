const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
    // Parse the JSON string in event.body
    const body = JSON.parse(event.body);
    // Now parse the actual JSON string to get the data object
    const data = JSON.parse(body);

    const { title, artist, album, fileContentBase64, fileName } = data;
    const trackId = uuidv4();

    const s3Params = {
        Bucket: 'music-app-bucket',
        Key: `tracks/${trackId}/${fileName}`,
        Body: Buffer.from(fileContentBase64, 'base64'),
        ContentType: 'audio/mpeg',
    };

    try {
        await s3.putObject(s3Params).promise();
        const dbParams = {
            TableName: 'music_app',
            Item: {
                TrackID: trackId,
                Title: title,
                Artist: artist,
                Album: album
            }
        };

        await dynamoDB.put(dbParams).promise();
        return { statusCode: 200, body: JSON.stringify({ message: 'Track added successfully', trackId: trackId }) };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to add the track', error: error.message }) };
    }
};
