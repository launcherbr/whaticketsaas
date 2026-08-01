import moment from "moment";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import AppError from "../../errors/AppError";

const RECURRENCE_MONTHS: Record<string, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12
};

export const getRecurrenceMonths = (recurrence?: string): number => {
  return RECURRENCE_MONTHS[(recurrence || "MENSAL").toUpperCase()] || 1;
};

export const calculateNextDueDate = (dueDate?: string, recurrence?: string): string => {
  const baseDate = dueDate && moment(dueDate).isValid() ? moment(dueDate) : moment();
  const renewalBase = baseDate.isAfter(moment()) ? baseDate : moment();

  return renewalBase
    .add(getRecurrenceMonths(recurrence), "months")
    .format("YYYY-MM-DD");
};

export const ensureOpenInvoiceForCompany = async (
  company: Company
): Promise<Invoices | null> => {
  if (!company.planId) return null;

  const plan = await Plan.findByPk(company.planId);
  if (!plan) {
    throw new AppError("Plano nao encontrado.", 404);
  }

  const dueDate = moment(company.dueDate || undefined).isValid()
    ? moment(company.dueDate).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");
  const openInvoices = await Invoices.findAll({
    where: {
      companyId: company.id,
      status: "open"
    },
    order: [["createdAt", "ASC"]]
  });

  const [openInvoice, ...extraInvoices] = openInvoices;

  await Promise.all(extraInvoices.map(invoice => invoice.update({ status: "cancelled" })));

  if (openInvoice) {
    await openInvoice.update({
      detail: plan.name,
      value: plan.value,
      dueDate
    });

    return openInvoice;
  }

  return Invoices.create({
    detail: plan.name,
    status: "open",
    value: plan.value,
    dueDate,
    companyId: company.id
  });
};

export const renewCompanyAfterPayment = async (
  company: Company,
  invoice: Invoices
): Promise<Company> => {
  const nextDueDate = calculateNextDueDate(company.dueDate, company.recurrence);

  await company.update({
    status: true,
    dueDate: nextDueDate
  });

  await invoice.update({
    status: "paid"
  });

  await company.reload();
  await ensureOpenInvoiceForCompany(company);
  await company.reload();

  return company;
};
