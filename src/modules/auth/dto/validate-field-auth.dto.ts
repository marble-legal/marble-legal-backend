import { ApiProperty } from "@nestjs/swagger";

export enum FieldType {
  Email = "email",
  Password = "password",
}

export class ValidateFieldAuthDto {
  @ApiProperty({ required: true })
  value: string;

  @ApiProperty({ required: true, enum: FieldType })
  fieldType: FieldType;
}
