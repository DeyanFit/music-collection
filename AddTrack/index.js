const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: 'eu-central-1' });

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const { title, artist, album, fileContentBase64, fileName } = JSON.parse(event.body);

    const trackId = uuidv4();

    const s3Params = {
        Bucket: 'david-music-bucket-vot',
        Key: `tracks/${trackId}/${fileName}`,
        Body: Buffer.from(fileContentBase64, 'base64'),
        ContentType: 'audio/mpeg'
    };

    const dbParams = {
        TableName: 'david-dynamodb-music',
        Item: {
            TrackID: trackId,
            Title: title,
            Artist: artist,
            Album: album,
            FileName: fileName,
            S3Bucket: s3Params.Bucket,
            S3Key: s3Params.Key
        }
    };

    try {
        await s3.putObject(s3Params).promise();
        console.log('File uploaded successfully.');

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
