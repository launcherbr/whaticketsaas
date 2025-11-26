import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import { isNil } from "lodash";
interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  whatsappId?: number;
  disableBot?: boolean;
  lid?: string;
  pushName?: string;
}

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  companyId,
  extraInfo = [],
  whatsappId,
  disableBot = false,
  lid
}: Request): Promise<Contact> => {
  const normalizedNumber = rawNumber.split(":")[0];
  let number = normalizedNumber.replace(/[^0-9]/g, "");

  if (isGroup) {
    number = rawNumber;
  } else {
    // CORREÇÃO: Tratamento para números do Brasil (55) com 13 dígitos (com o 9 adicional)
    // Ex: 55 14 9 9999 9999 (13 dig) -> vira 55 14 9999 9999 (12 dig)
    if (number.length === 13 && number.startsWith("55")) {
      // Se o dígito após o DDD (índice 4) for 9, removemos ele.
      if (number[4] === "9") {
        number = number.slice(0, 4) + number.slice(5);
      } else {
        // Caso raro de ter 13 dígitos mas não ser o formato padrão do 9º dígito, mantém o corte de segurança
        number = number.slice(0, 12);
      }
    } else {
      // Comportamento padrão original: limita a 12 caracteres
      number = number.slice(0, 12);
    }
  }
  
  console.log(`Procurando ou criando contato: ${number} (LID: ${lid || "N/A"}) na empresa ${companyId}`);

  const io = getIO();
  let contact: Contact | null;

  if (isGroup) {
    lid = null; // Grupos não usam LID
  }

  // Se temos um LID, primeiro tentamos encontrar o contato pela coluna lid
  if (lid && !isGroup) {
    contact = await Contact.findOne({
      where: {
        lid,
        companyId
      }
    });
    
    if (contact) {
      console.log(`Contato encontrado pelo LID: ${lid}`);
    }
  }

  // Se não encontrou pelo LID ou não temos LID, tenta pelo number
  if (!contact) {
    contact = await Contact.findOne({
      where: {
        number,
        companyId
      }
    });
    
    if (contact) {
      console.log(`Contato encontrado pelo number: ${number}`);
    }
  }

  if (contact) {
    contact.update({ profilePicUrl });
    console.log(contact.whatsappId)
    if (isNil(contact.whatsappId === null)) {
      contact.update({
        whatsappId
      });
    }
    // Atualizar LID se fornecido
    contact.update({ lid });
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });
  } else {
    contact = await Contact.create({
      name,
      number,
      profilePicUrl,
      email,
      isGroup,
      extraInfo,
      companyId,
      whatsappId,
      disableBot,
      lid
    });

    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
      action: "create",
      contact
    });
  }

  return contact;
};

export default CreateOrUpdateContactService;