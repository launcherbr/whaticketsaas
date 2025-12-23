import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  birthday?: string;
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  companyId,
  extraInfo = [],
  disableBot = false,
  birthday
}: Request): Promise<Contact> => {
  const numberExists = await Contact.findOne({
    where: { number, companyId }
  });

  if (numberExists) {
    throw new AppError("ERR_DUPLICATED_CONTACT");
  }

  // Trata a data de aniversário para evitar problemas de timezone
  // O campo DATEONLY do Sequelize espera uma string YYYY-MM-DD ou Date em UTC
  let birthdayDate = null;
  if (birthday) {
    const dateStr = birthday.toString();
    // Se já está no formato YYYY-MM-DD, cria Date em UTC para manter a data correta
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Extrai ano, mês e dia e cria Date em UTC (meio-dia UTC para evitar problemas)
      const [year, month, day] = dateStr.split('-').map(Number);
      birthdayDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else if (dateStr.includes('T')) {
      // Se tem timestamp, extrai apenas a data e cria em UTC
      const date = new Date(dateStr);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      birthdayDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    } else {
      // Tenta converter para Date em UTC
      const date = new Date(dateStr);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      birthdayDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    }
  }

  const contact = await Contact.create(
    {
      name,
      number,
      email,
      extraInfo,
      companyId,
      birthday: birthdayDate
    },
    {
      include: ["extraInfo"]
    }
  );

  return contact;
};

export default CreateContactService;
