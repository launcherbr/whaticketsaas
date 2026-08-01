import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import Plan from "../../models/Plan";
import { ensureOpenInvoiceForCompany } from "../InvoicesService/CompanyInvoiceService";

interface CompanyData {
  name: string;
  id?: number | string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
}

const UpdateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const company = await Company.findByPk(companyData.id);

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  const {
    name,
    phone,
    email,
    status,
    planId,
    campaignsEnabled,
    dueDate,
    recurrence
  } = companyData;

  const effectivePlanId = planId || company.planId;
  const plan = await Plan.findByPk(effectivePlanId);

  if (!plan) {
    throw new AppError("Plano nao encontrado.", 404);
  }

  await company.update({
    name,
    phone,
    email,
    status,
    planId: effectivePlanId,
    dueDate,
    recurrence
  });

  await ensureOpenInvoiceForCompany(company);

  if (companyData.campaignsEnabled !== undefined) {
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "campaignsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "campaignsEnabled",
        value: `${campaignsEnabled}`
      }
    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` });
    }
  }

  return company;
};

export default UpdateCompanyService;
