class BusinessEntityClientDto {
  name: string;
  address: string;
  phone: string;
  email: string;
}

class BusinessEntityOwnerDto {
  name: string;
  address: string;
  interest: string;
  initialContribution: string;
}

export class CreateBusinessEntityDto {
  name: string;
  address: string;
  state: string;
  clients: BusinessEntityClientDto[];
  owners: BusinessEntityOwnerDto[];
  isInvestorsUsCitizen?: boolean;
  isRestrictionsOnTransfer?: boolean;
  restrictionsOnTransferDetail?: string;
  isProfitsLossSharedEqually?: boolean;
  type?: string;
  issues?: string;
  purpose?: string;
  agent?: string;
  useTrademark?: string;
  specialLicenses?: string;
  bankAccountType?: string;
  loanDetail?: string;
  accountantDetail?: string;
  managementDetail?: string;
  signingResposibility?: string;
  powersDetail?: string;
  initialOfficers?: string;
}
