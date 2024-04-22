const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-central-1' });

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { trackId, rating } = JSON.parse(event.body);
        if (!trackId || rating == null) {
            throw new Error('Missing trackId or rating in the request body');
        }

        const params = {
            TableName: 'TracksTable',
            Key: {
                "TrackID": trackId
            },
            UpdateExpression: "set Rating = :r",
            ExpressionAttributeValues:{
                ":r": rating
            },
            ReturnValues:"UPDATED_NEW"
        };

        const data = await dynamoDB.update(params).promise();
        console.log('Track rating updated successfully:', data);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Track rating updated successfully', updatedAttributes: data.Attributes }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        console.error('Error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to process your request', error: error.message }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
};

