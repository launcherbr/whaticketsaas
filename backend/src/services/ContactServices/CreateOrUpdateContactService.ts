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

// Função para normalizar número de telefone removendo zeros à direita
// Isso garante que números como 5511999999990 e 55119999999900 sejam tratados como iguais
const normalizePhoneNumber = (number: string): string => {
  if (!number) return '';
  
  // Remove caracteres não numéricos
  let cleanNumber = number.replace(/[^0-9]/g, "");
  
  // Remove o sufixo se ainda estiver presente
  cleanNumber = cleanNumber.split("@")[0].split(":")[0];
  
  // Remove zeros à direita desnecessários apenas se o número tiver mais de 13 dígitos
  // Números brasileiros válidos têm:
  // - 12 dígitos: código país (2) + DDD (2) + número fixo (8)
  // - 13 dígitos: código país (2) + DDD (2) + número celular (9)
  // Isso evita duplicação de contatos com números terminados em zero
  while (cleanNumber.length > 13 && cleanNumber.endsWith('0')) {
    cleanNumber = cleanNumber.slice(0, -1);
  }
  
  // Limita a 13 dígitos - números brasileiros têm no máximo 13 dígitos
  return cleanNumber.slice(0, 13);
};

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
  // Para grupos, mantém o rawNumber; para contatos, normaliza removendo zeros à direita
  const number = isGroup ? rawNumber : normalizePhoneNumber(rawNumber);
  
  console.log(`Procurando ou criando contato: ${number} (LID: ${lid || "N/A"}) na empresa ${companyId} (número original: ${rawNumber})`);

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