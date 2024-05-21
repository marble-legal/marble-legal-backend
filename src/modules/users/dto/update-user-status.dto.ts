import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserStatusDto {
  @ApiProperty({
    description: "Mark active or deactivate user",
  })
  readonly isActive: boolean;
}
