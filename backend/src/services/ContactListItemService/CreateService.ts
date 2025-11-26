import * as Yup from "yup";
import AppError from "../../errors/AppError";
import ContactListItem from "../../models/ContactListItem";
import { logger } from "../../utils/logger";
import CheckContactNumber from "../WbotServices/CheckNumber";

interface Data {
  name: string;
  number: string;
  contactListId: number;
  companyId: number;
  email?: string;
}

const CreateService = async (data: Data): Promise<ContactListItem> => {
  const { name } = data;

  const contactListItemSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, "ERR_CONTACTLISTITEM_INVALID_NAME")
      .required("ERR_CONTACTLISTITEM_REQUIRED")
  });

  try {
    await contactListItemSchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const [record] = await ContactListItem.findOrCreate({
    where: {
      number: data.number,
      companyId: data.companyId,
      contactListId: data.contactListId
    },
    defaults: data
  });

  try {
    const response = await CheckContactNumber(record.number, record.companyId);
    record.isWhatsappValid = response.exists;
    
    // CORREÇÃO: Lógica Híbrida de Normalização (12 ou 13 dígitos)
    let number = response.jid.replace(/\D/g, "");
    
    if (number.length === 13 && number.startsWith("55")) {
      const ddd = parseInt(number.substring(2, 4));
      const ninthDigit = number[4];
      const nextDigit = parseInt(number[5]);

      const dddsNonoDigitoObrigatorio = [
        11, 12, 13, 14, 15, 16, 17, 18, 19,
        21, 22, 24,
        27, 28
      ];

      if (dddsNonoDigitoObrigatorio.includes(ddd)) {
         // Mantém 13 dígitos
      } else {
        if (ninthDigit === "9") {
           if (nextDigit >= 7) {
             // Remove o 9 se for faixa antiga
             number = number.slice(0, 4) + number.slice(5);
           }
        } else {
           number = number.slice(0, 12);
        }
      }
    } else {
      number = number.slice(0, 12);
    }

    record.number = number;
    await record.save();
  } catch (e) {
    logger.error(`Número de contato inválido: ${record.number}`);
  }

  return record;
};

export default CreateService;
