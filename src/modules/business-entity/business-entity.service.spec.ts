import { Test, TestingModule } from "@nestjs/testing";
import { BusinessEntityService } from "./business-entity.service";

describe("BusinessEntityService", () => {
  let service: BusinessEntityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessEntityService],
    }).compile();

    service = module.get<BusinessEntityService>(BusinessEntityService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
