import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { verifyEmail } from '../nodemailer.js';
import dotenv from 'dotenv';
dotenv.config();

const region = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_ID_SQS;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY_SQS;
const queueUrl = process.env.AWS_QUEUE_URL;

const sqsClient = new SQSClient({
  region: region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

const sendMessageToQueue = async (body) => {
  try {
    const message = JSON.stringify(body);

    const input = {
      QueueUrl: queueUrl,
      MessageBody: message,

      MessageAttributes: {
        messageId: { DataType: 'String', StringValue: body.userId },
      },
    };

    const command = new SendMessageCommand(input);
    const response = await sqsClient.send(command);
    return response;
  } catch (error) {
    console.log(error);
  }
};

const deleteMessageFromQueue = async (ReceiptHandle) => {
  try {
    const input = {
      QueueUrl: queueUrl,
      ReceiptHandle: ReceiptHandle,
    };
    const command = new DeleteMessageCommand(input);
    const response = await sqsClient.send(command);
    console.log('DELETE RESPONSE:', response);

    return response;
  } catch (error) {
    console.log(error);
  }
};

const pollMessageFromQueue = async () => {
  try {
    const input = {
      QueueUrl: queueUrl,
      MessageAttributeName: ['All'],
      WaitTimeSeconds: 20,
      MaxNumberOfMessages: 10,
      VisibilityTimeout: 30,
    };

    const command = new ReceiveMessageCommand(input);
    const response = await sqsClient.send(command);
    const messages = response.Messages;
    if (messages && messages.length > 0) {
      messages.forEach(async (message) => {
        const data = JSON.parse(message.Body);
        const { email, firstName, link, userId, messageTitle } = data;

        if (messageTitle.toLowerCase() === 'email verification') {
          const sendMail = await verifyEmail({
            email,
            firstName,
            link,
          });

          if (sendMail) {
            console.log('MESSAGE SENT:', sendMail);
            const isDeleted = await deleteMessageFromQueue(
              message.ReceiptHandle
            );

            if (isDeleted) {
              console.log('message deleted successfully');
            } else {
              console.log('Unable to delete message from queue');
            }
          } else {
            return null;
          }
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// setInterval(() => {
//   pollMessageFromQueue();
// }, 30000);

/*
1) send mail to queue
2) pull message from queue and send to the email of the user
3) delete sent message from queue
*/

export { sendMessageToQueue };
