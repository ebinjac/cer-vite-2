// types/form.ts
export interface BaseFormData {
  applicationName: string;
  comment?: string;
}

export interface CertificateFormData extends BaseFormData {
  commonName: string;
  serialNumber: string;
  centralID: string;
  isAmexCert: 'Yes' | 'No';
  validTo?: Date;
  environment?: string;
  serverName?: string;
  keystorePath?: string;
  uri?: string;
}

export interface ServiceIdFormData extends BaseFormData {
  svcid: string;
  env: string;
  renewalProcess: string;
  expDate: Date;
}

export interface ApiError {
  message: string;
  status?: number;
}
