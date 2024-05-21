import { Injectable } from "@nestjs/common";
import * as AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

@Injectable()
export class EmailService {
  constructor() {}
  async sendEmail(options: {
    toEmailIds: string[];
    ccEmailIds?: string[];
    subject: string;
    isHtml?: boolean;
    body?: string;
    senderEmail?: string;
  }): Promise<string> {
    // Create sendEmail params
    const body = {};
    if (options.isHtml) {
      body["Html"] = {
        Charset: "UTF-8",
        Data: options.body,
      };
    } else {
      body["Text"] = {
        Charset: "UTF-8",
        Data: options.body,
      };
    }
    const params = {
      Destination: {
        CcAddresses: options.ccEmailIds,
        ToAddresses: options.toEmailIds,
      },
      Message: {
        Body: body,
        Subject: {
          Charset: "UTF-8",
          Data: options.subject,
        },
      },
      Source: options.senderEmail ?? process.env.EMAIL_SENDER_ID,
    };

    try {
      const data = await new AWS.SES({
        apiVersion: "2010-12-01",
        region: process.env.AWS_REGION,
      })
        .sendEmail(params)
        .promise();
      return data.MessageId;
    } catch (err) {
      console.error(err);
    }
  }
}
