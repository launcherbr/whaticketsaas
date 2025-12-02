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
    // =========================================================================
    // LÓGICA HÍBRIDA DE NORMALIZAÇÃO DE TELEFONES BRASILEIROS
    // =========================================================================
    if (number.length === 13 && number.startsWith("55")) {
      const ddd = parseInt(number.substring(2, 4));
      const ninthDigit = number[4];
      const nextDigit = parseInt(number[5]);

      // 1. LISTA VIP: DDDs onde o nono dígito é OBRIGATÓRIO para TODOS os celulares
      // (11-19: SP, 21,22,24: RJ, 27,28: ES)
      const dddsNonoDigitoObrigatorio = [
        11, 12, 13, 14, 15, 16, 17, 18, 19,
        21, 22, 24,
        27, 28
      ];

      if (dddsNonoDigitoObrigatorio.includes(ddd)) {
        // Se for desses DDDs, mantém os 13 dígitos (não corta nada)
        number = number; 
      } else {
        // 2. OUTROS DDDs (34, 31, etc): Aplicamos a lógica da faixa de numeração
        if (ninthDigit === "9") {
           // Se o dígito seguinte for 7, 8 ou 9: É celular antigo/padrão. 
           // Removemos o 9 extra para ficar com 12 dígitos (padrão da API para esses casos).
           if (nextDigit >= 7) {
             number = number.slice(0, 4) + number.slice(5);
           } 
           // Se o dígito seguinte for 2, 3, 4, 5 ou 6: É celular novo ou colisão com fixo.
           // Mantemos o 9 (fica com 13 dígitos). Ex: 55 34 9 3...
           else {
             number = number;
           }
        } else {
           // Segurança: Se tem 13 dígitos mas o 5º não é 9 (formato estranho), corta pro padrão
           number = number.slice(0, 12);
        }
      }
    } else {
      // Padrão de segurança para números internacionais ou fixos (corta excesso se houver)
      number = number.slice(0, 12);
    }
  }
  
  console.log(`Procurando ou criando contato: ${number} (LID: ${lid || "N/A"}) na empresa ${companyId}`);

  const io = getIO();
  let contact: Contact | null;

  if (isGroup) {
    lid = null; // Grupos não usam LID
  }

  // Se temos um LID e não é grupo, primeiro tentamos encontrar o contato pela coluna lid
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
    
    if (isNil(contact.whatsappId === null)) {
      contact.update({
        whatsappId
      });
    }
    // Atualizar LID se fornecido e diferente
    if (lid && contact.lid !== lid) {
      contact.update({ lid });
    }

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