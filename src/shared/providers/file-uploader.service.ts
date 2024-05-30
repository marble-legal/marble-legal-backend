import { Injectable } from "@nestjs/common";
import * as AWS from "aws-sdk";
import * as fs from "fs";

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

@Injectable()
export class FileUploaderService {
  constructor() {}
  async uploadContent(
    filePath: string,
    path: string,
    fileName: string,
    contentType: string,
  ): Promise<any> {
    console.log(`Uploading file at ${path}`);
    const fileStream = fs.createReadStream(filePath);

    const params = {
      Bucket: process.env.ASSETS_BUCKET_NAME,
      Key: `${path}/${fileName}`,
      Body: fileStream,
      ACL: "public-read",
      ContentType: contentType,
    };

    try {
      return await new AWS.S3({ apiVersion: "2012-11-05" })
        .upload(params)
        .promise();
    } catch (err) {
      console.error(err);
    }
  }
}
