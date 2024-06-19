import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import { Contract } from "./entities/contract.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { OpenAIService } from "src/shared/providers/openai.service";
import { GetContractsDto } from "./dto/get-contracts.dto";
import { FileUploaderService } from "src/shared/providers/file-uploader.service";
import { Conversation } from "../conversations/entities/conversation.entity";
import { CreateContractConversationDto } from "./dto/create-contract-conversation.dto";
import * as fs from "fs";
const util = require("util");
const pdf = require("html-pdf");
const os = require("os");
const puppeteer = require("puppeteer");

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractsRepository: Repository<Contract>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    private readonly openAIService: OpenAIService,
    private readonly fileUploaderService: FileUploaderService,
  ) {}

  async create(createContractDto: CreateContractDto, userId: string) {
    const prompt = `${createContractDto.content}. Response must be in json format. Example: {"title":"", "summary": "", "content":"<h1>agreemtn</h1>"}`;
    const response = await this.openAIService.suggestMessage(
      prompt,
      [],
      true,
      "Generate a legal contract based on the details provided. Also generate title in max 5 words and summary in max 25 words. The agreement must be properly styled and formatted, must have some margins on all sides and should be in a professional tone. The content of agreement must be in html format without <html>, <head> and <body> tag.",
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

    await this.createPdf(aiResponse.content);
    const url = await this.fileUploaderService.uploadContent(
      "tnc.pdf",
      `app/users/${userId}/contracts/${contractObj.id}`,
      `${contractObj.title}.pdf`,
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
    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
      const page = await browser.newPage();

      // Set the HTML content to the page
      await page.setContent(`<html><body>${content}</body></html>`, {
        waitUntil: "domcontentloaded",
      });

      // Convert the page to PDF
      await page.pdf({
        path: "tnc.pdf",
        format: "A4",
      });

      // Close the browser
      await browser.close();
    } catch (error) {
      throw error;
    }
  }

  async findAll(getContractsDto: GetContractsDto) {
    return await this.contractsRepository.findBy({
      userId: getContractsDto.userId,
      isActive: true,
      isGenerated: getContractsDto.isGenerated,
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
    const contract = await this.contractsRepository.findOneBy({
      id: id,
    });
    if (!contract) {
      throw new NotFoundException("Contract not found");
    }
    await this.createPdf(updateContractDto.content);
    const url = await this.fileUploaderService.uploadContent(
      "tnc.pdf",
      `app/users/${userId}/contracts`,
      `${contract.title}.pdf`,
      "application/pdf",
    );

    await this.contractsRepository.update(
      {
        id: id,
      },
      {
        pdfUrl: url.Location,
        generatedContent: updateContractDto.content,
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

  async provideQueryResponse(
    id: string,
    createContractConversationDto: CreateContractConversationDto,
    userId: string,
  ) {
    const previousConversations = await this.conversationsRepository.find({
      where: {
        contractId: id,
        userId: userId,
        isActive: true,
      },
      order: { createdAt: "DESC" },
      take: 16,
    });

    const latestConversations = previousConversations
      .reverse()
      .map((conversation) => {
        if (conversation.isUserMessage) {
          return { role: "user", content: conversation.message };
        }

        return { role: "assistant", content: conversation.message };
      });

    console.log("latestConversations", latestConversations);

    const aiResponse = await this.openAIService.provideResponseFromDocument(
      id,
      createContractConversationDto.message,
    );

    console.log(aiResponse);

    const message = aiResponse;

    await this.conversationsRepository.insert({
      userId: userId,
      message: createContractConversationDto.message,
      isUserMessage: true,
      contractId: id,
    });

    await this.conversationsRepository.insert({
      userId: userId,
      message: message,
      isUserMessage: false,
      contractId: id,
    });

    return {
      message: message,
    };
  }

  async uploadContract(file: Express.Multer.File, userId: string) {
    const buff = file.buffer;
    const filePath = `/tmp/${file.originalname}`;
    fs.writeFileSync(filePath, buff);

    const contractObj = await this.contractsRepository.save({
      userId: userId,
      title: file.originalname,
      isGenerated: false,
    });

    const [s3Response] = await Promise.all([
      this.fileUploaderService.uploadContent(
        filePath,
        `app/users/${userId}/contracts/${contractObj.id}`,
        `${contractObj.id}.pdf`,
        file.mimetype,
      ),
      this.openAIService.storeDocumentInRagLayer(filePath, contractObj.id),
    ]);

    await this.contractsRepository.update(
      {
        id: contractObj.id,
      },
      {
        pdfUrl: s3Response.Location,
      },
    );

    return {
      message: "Contract uploaded successfully",
    };
  }
}
