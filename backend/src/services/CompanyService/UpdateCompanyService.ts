import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";

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

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  const openInvoices = await Invoices.findAll({
    where: {
      status: "open",
      companyId: company.id,
    },
 });

 if (openInvoices.length > 1) {
  for (const invoice of openInvoices.slice(1)) {
    await invoice.update({ status: "cancelled" });
  }
}

const plan = await Plan.findByPk(planId);

if (!plan) {
  throw new Error("Plano Não Encontrado.");
}


  // 5. Atualizar a única invoice com status "open" existente, baseada no companyId.
  const openInvoice = openInvoices[0];
  
  if (openInvoice) {
    await openInvoice.update({
      value: plan.value,
      detail: plan.name,
      dueDate: dueDate,
    });
  
  } else {
    throw new Error("Nenhuma fatura em aberto para este cliente!");
  }

  await company.update({
    name,
    phone,
    email,
    status,
    planId,
    dueDate,
    recurrence
  });

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
