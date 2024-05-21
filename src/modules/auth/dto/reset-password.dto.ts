import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    description: "Reset password token",
  })
  @IsNotEmpty()
  readonly resetPasswordToken!: string;

  @ApiProperty({
    description: "password",
    nullable: false,
  })
  @IsNotEmpty()
  readonly password!: string;
}
