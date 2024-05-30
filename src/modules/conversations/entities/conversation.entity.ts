import { Base } from "src/shared/entities/base.entity";
import { Column, Entity, Index } from "typeorm";

export enum LikeStatus {
  Like = 1,
  DisLike = -1,
  None = 0,
}

@Entity()
export class Conversation extends Base {
  @Index()
  @Column()
  userId: string;

  @Column()
  message: string;

  @Column()
  isUserMessage: boolean;

  @Column({ default: LikeStatus.None })
  likeStatus: LikeStatus;

  @Column({nullable: true})
  contractId?: string;
}
