import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Announcement from "../../models/Announcement";
import Company from "../../models/Company";

interface Data {
  priority: string;
  title: string;
  text: string;
  status: string;
  companyId: number;
  showForSuperAdmin?: boolean;
  sendToAllCompanies?: boolean;
  mediaPath?: string;
  mediaName?: string;
}

interface CreateResult {
  announcement: Announcement;
  companiesCount: number;
}

const CreateService = async (data: Data): Promise<CreateResult> => {
  const { title, text, sendToAllCompanies } = data;

  const ticketnoteSchema = Yup.object().shape({
    title: Yup.string().required("ERR_ANNOUNCEMENT_REQUIRED"),
    text: Yup.string().required("ERR_ANNOUNCEMENT_REQUIRED")
  });

  try {
    await ticketnoteSchema.validate({ title, text });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  let companiesCount = 1;

  // Se sendToAllCompanies for true, criar anúncio para todas empresas
  if (sendToAllCompanies) {
    const companies = await Company.findAll({
      attributes: ["id"]
    });
    companiesCount = companies.length;

    // Criar anúncio para cada empresa
    const announcements = await Promise.all(
      companies.map(company =>
        Announcement.create({
          ...data,
          companyId: company.id
        })
      )
    );

    // Retornar o primeiro anúncio criado (representativo)
    return {
      announcement: announcements[0],
      companiesCount
    };
  } else {
    // Criar anúncio apenas para a empresa atual
    const record = await Announcement.create(data);
    return {
      announcement: record,
      companiesCount: 1
    };
  }
};

export default CreateService;
