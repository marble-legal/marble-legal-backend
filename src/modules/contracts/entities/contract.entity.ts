import { Base } from "src/shared/entities/base.entity";
import { Column, Entity, Index } from "typeorm";

export enum ContractType {}

@Entity()
export class Contract extends Base {
  @Index()
  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  summary?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  pdfUrl?: string;

  @Column({ nullable: true, type: "text" })
  content?: string;

  @Column({ nullable: true, type: "text" })
  generatedContent?: string;

  @Column()
  isGenerated: boolean;
}
