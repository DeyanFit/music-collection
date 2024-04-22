const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

ffmpeg.setFfmpegPath(ffmpegStatic);

exports.handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const params = {
    Bucket: bucket,
    Key: key
  };

  try {
    const inputData = await s3.getObject(params).promise();

    const inputFilePath = '/tmp/input.mp3';
    fs.writeFileSync(inputFilePath, inputData.Body);

    const outputFilePath = '/tmp/output.mp3';

    return new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .audioCodec('libmp3lame')
        .toFormat('mp3')
        .outputOptions('-t', '5')
        .on('end', () => {
          console.log('Audio processing completed.');
          const outputData = fs.readFileSync(outputFilePath);

          const outputParams = {
            Bucket: bucket,
            Key: `samples/${key.split('/').pop()}`,
            Body: outputData
          };
          s3.putObject(outputParams, function(err, data) {
            if (err) {
              console.error('Error uploading:', err);
              reject(err);
            } else {
              console.log('Upload successful:', data);
              resolve('Audio processing and upload completed.');
            }
          });
        })
        .on('error', (err) => {
          console.error('Error processing audio:', err);
          reject(new Error('Error processing audio'));
        })
        .save(outputFilePath);
    });
  } catch (err) {
    console.error('Error getting object from S3:', err);
    throw new Error('Error getting object from S3');
  }
};

