const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-central-1' });

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const params = {
        TableName: 'TracksTable'
    };

    try {
        const data = await dynamoDB.scan(params).promise();
        console.log('Data retrieved successfully:', data.Items);

        return {
            statusCode: 200,
            body: JSON.stringify(data.Items),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        console.error('Error retrieving data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to retrieve tracks', error: error.message }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
};

