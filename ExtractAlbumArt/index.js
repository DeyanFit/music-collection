const AWS = require('aws-sdk');
const mm = require('music-metadata');
const { Readable } = require('stream');

AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3();

exports.handler = async (event) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    try {
        const params = {
            Bucket: bucket,
            Key: key
        };
        const data = await s3.getObject(params).promise();

        const metadata = await mm.parseBuffer(data.Body, data.ContentType);
        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];

            // Determine the file extension based on the content type
            let extension = 'jpg'; // Default to jpg
            if (picture.format === 'image/png') {
                extension = 'png';
            } else if (picture.format === 'image/jpeg') {
                extension = 'jpg';
            }

            const imageParams = {
                Bucket: bucket,
                Key: `album-cover/${key.split('/').pop().split('.')[0]}.${extension}`,
                Body: Readable.from(picture.data),
                ContentType: picture.format,
                ContentLength: picture.data.length
            };
            await s3.putObject(imageParams).promise();

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Album art extracted and uploaded successfully!' })
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No album art found in this track' })
            };
        }
    } catch (error) {
        console.error('Error extracting album art:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to extract album art', error: error.message })
        };
    }
};

