import { Injectable } from "@nestjs/common";
import * as AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

@Injectable()
export class QueueService {
  constructor() {}
  async sendMessage(
    data: any,
    queueUrl: string,
    message: string,
  ): Promise<string> {
    try {
      const params = {
        DelaySeconds: 10,
        MessageAttributes: Object.keys(data).reduce((prev, curr) => {
          return {
            ...prev,
            [curr]: {
              DataType: "String",
              StringValue: data[curr],
            },
          };
        }, {}),
        MessageBody: message,
        QueueUrl: queueUrl,
      };

      const result = await new AWS.SQS({ apiVersion: "2012-11-05" })
        .sendMessage(params)
        .promise();
      return result?.MessageId;
    } catch (err) {
      console.error(err);
    }
  }
}
