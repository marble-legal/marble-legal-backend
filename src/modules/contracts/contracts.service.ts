import { Injectable } from "@nestjs/common";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import { Contract } from "./entities/contract.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OpenAIService } from "src/shared/providers/openai.service";
import { GetContractsDto } from "./dto/get-contracts.dto";
import { FileUploaderService } from "src/shared/providers/file-uploader.service";
const util = require("util");
const pdf = require("html-pdf");
const os = require("os");

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractsRepository: Repository<Contract>,
    private readonly openAIService: OpenAIService,
    private readonly fileUploaderService: FileUploaderService,
  ) {}

  async create(createContractDto: CreateContractDto, userId: string) {
    const prompt = `${createContractDto.content}. Response must be in json format. Example: {"title":"", "summary": "", "content":""}`;
    const response = await this.openAIService.suggestMessage(
      prompt,
      [],
      true,
      "Generate a legal contract based on the details provided. Also generate title and summary. The agreement must be properly styled and formatted, and should be in a professional tone. The content of agreement must be in html",
    );
    const aiResponse = JSON.parse(response);

    const contractObj = await this.contractsRepository.save({
      type: createContractDto.type,
      userId: userId,
      title: aiResponse.title,
      summary: aiResponse.summary,
      content: createContractDto.content,
      generatedContent: aiResponse.content,
      isGenerated: true,
    });

    const pdfPath = await this.createPdf(aiResponse.content);
    const url = await this.fileUploaderService.uploadContent(
      pdfPath.filename,
      `app/users/${userId}/contracts`,
      `${contractObj.id}.pdf`,
      "application/pdf",
    );

    await this.contractsRepository.update(
      {
        id: contractObj.id,
      },
      {
        pdfUrl: url.Location,
      },
    );

    return {
      ...contractObj,
      pdfUrl: url.Location,
    };
  }

  async createPdf(content: string) {
    const options = {
      height: "1000mm",
      width: "210mm",
      orientation: "portrait",
      directory: os.tmpdir(),
      filename: "tnc.pdf",
    };

    try {
      const create = util.promisify(pdf.create);
      return await create(content, options);
    } catch (error) {
      throw error;
    }
  }

  async findAll(getContractsDto: GetContractsDto) {
    return await this.contractsRepository.findBy({
      userId: getContractsDto.userId,
    });
  }

  async findOne(id: string) {
    return await this.contractsRepository.findOneBy({
      id: id,
    });
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
    userId: string,
  ) {
    const pdfPath = await this.createPdf(updateContractDto.content);
    const url = await this.fileUploaderService.uploadContent(
      pdfPath.filename,
      `app/users/${userId}/contracts`,
      `${id}.pdf`,
      "application/pdf",
    );

    await this.contractsRepository.update(
      {
        id: id,
      },
      {
        pdfUrl: url.Location,
      },
    );

    return {
      message: "Contract updated successfully",
    };
  }

  async remove(id: string) {
    await this.contractsRepository.update(
      {
        id: id,
      },
      {
        isActive: false,
      },
    );
  }
}
