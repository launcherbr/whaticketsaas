import AppError from "../../errors/AppError";
import ContactListItem from "../../models/ContactListItem";
import { logger } from "../../utils/logger";
import CheckContactNumber from "../WbotServices/CheckNumber";

interface Data {
  id: number | string;
  name: string;
  number: string;
  email?: string;
}

const UpdateService = async (data: Data): Promise<ContactListItem> => {
  const { id, name, number, email } = data;

  const record = await ContactListItem.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_CONTACTLISTITEM_FOUND", 404);
  }

  await record.update({
    name,
    number,
    email
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
        // Mantém 13 dígitos para DDDs VIP
      } else {
        if (ninthDigit === "9") {
           if (nextDigit >= 7) {
             // Remove o 9 se for faixa antiga (7, 8, 9)
             number = number.slice(0, 4) + number.slice(5);
           }
           // Se for < 7, mantém os 13 dígitos
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

export default UpdateService;
