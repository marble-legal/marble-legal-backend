import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserPasswordDto {
  @ApiProperty({ required: true })
  oldPassword: string;

  @ApiProperty({ required: true })
  newPassword: string;
}
