import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetStripeCustomerPortalUrlDto {
  @ApiProperty({
    description: "The redirect url.",
    example: "http://localhost:3000",
  })
  @IsString()
  readonly redirectUrl!: string;
}
