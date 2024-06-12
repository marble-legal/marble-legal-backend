import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";

export enum GetSignedUrlUploadType {
  USER_PROFILE = "USER_PROFILE",
}

export class GetSignedUrlDto {
  @ApiProperty({
    description: "The upload type.",
    enum: GetSignedUrlUploadType,
  })
  @IsEnum(GetSignedUrlUploadType)
  readonly uploadType!: GetSignedUrlUploadType;

  @ApiProperty({
    description: "The MIME type of images that will be uploaded.",
    example: "image/png",
  })
  @IsString()
  readonly mimeType!: string;

  fileName?: string;
}
