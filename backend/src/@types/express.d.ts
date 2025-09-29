declare namespace Express {
  export interface Request {
    user: { id: string; profile: string; companyId: number };
    id: string;
    rawBody?: Buffer;
  }
}
