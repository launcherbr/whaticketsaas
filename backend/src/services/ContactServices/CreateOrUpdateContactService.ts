import { getIO } from "../../libs/socket";
import { Op } from "sequelize";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import Schedule from "../../models/Schedule";
import TicketNote from "../../models/TicketNote";
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
  lid?: string | null;
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
  lid,
  pushName
}: Request): Promise<Contact> => {
  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
  const normalizedLid = lid || null;

  console.log(`Procurando ou criando contato: ${number} (LID: ${normalizedLid || "N/A"}) na empresa ${companyId}`);

  const io = getIO();
  let contact: Contact | null = null;
  let contactByLid: Contact | null = null;
  let contactByNumber: Contact | null = null;

  if (isGroup) {
    lid = null; // Grupos não usam LID
  }

  // Se temos um LID, primeiro tentamos encontrar o contato pela coluna lid
  if (normalizedLid && !isGroup) {
    contactByLid = await Contact.findOne({
      where: {
        lid: normalizedLid,
        companyId
      }
    });

    if (contactByLid) {
      console.log(`Contato encontrado pelo LID: ${normalizedLid}`);
    }
  }

  // Se não encontrou pelo LID ou não temos LID, tenta pelo number
  contactByNumber = await Contact.findOne({
    where: {
      number,
      companyId
    }
  });

  if (contactByNumber) {
    console.log(`Contato encontrado pelo number: ${number}`);
  }

  // Resolver conflitos entre registros diferentes (um por LID e outro por número)
  if (contactByLid && contactByNumber && contactByLid.id !== contactByNumber.id) {
    console.log(
      `Encontrados dois contatos distintos para o mesmo usuário (lid=${contactByLid.id}, number=${contactByNumber.id}). Mesclando registros.`
    );

    await mergeContacts(contactByLid, contactByNumber);
    contact = await contactByNumber.reload();
  } else {
    contact = contactByLid || contactByNumber || null;
  }

  if (contact) {
    await applyContactUpdates(contact, {
      name,
      pushName,
      profilePicUrl,
      email,
      whatsappId,
      disableBot,
      lid: normalizedLid,
      number,
      isGroup
    });

    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });

    return contact;
  }

  const newContact = await Contact.create({
    name,
    number,
    profilePicUrl,
    email,
    isGroup,
    extraInfo,
    companyId,
    whatsappId,
    disableBot,
    lid: normalizedLid
  });

  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
    action: "create",
    contact: newContact
  });

  return newContact;
};

export default CreateOrUpdateContactService;

interface UpdatePayload {
  name?: string;
  pushName?: string;
  profilePicUrl?: string;
  email?: string;
  whatsappId?: number;
  disableBot?: boolean;
  lid?: string | null;
  number?: string;
  isGroup: boolean;
}

const applyContactUpdates = async (contact: Contact, payload: UpdatePayload) => {
  const updates: Partial<Contact> = {};

  if (payload.profilePicUrl && payload.profilePicUrl !== contact.profilePicUrl) {
    updates.profilePicUrl = payload.profilePicUrl;
  }

  if (payload.email && payload.email !== contact.email) {
    updates.email = payload.email;
  }

  if (!contact.isGroup && payload.number && payload.number !== contact.number) {
    // Garantir que não exista outro contato com o mesmo número antes de atualizar
    const existing = await Contact.findOne({
      where: {
        number: payload.number,
        companyId: contact.companyId,
        id: {
          [Op.ne]: contact.id
        }
      }
    });

    if (!existing) {
      updates.number = payload.number;
    }
  }

  if (!isNil(payload.whatsappId) && payload.whatsappId !== contact.whatsappId) {
    updates.whatsappId = payload.whatsappId;
  }

  if (payload.disableBot !== undefined && payload.disableBot !== contact.disableBot) {
    updates.disableBot = payload.disableBot;
  }

  if (!payload.isGroup && payload.lid && payload.lid !== contact.lid) {
    updates.lid = payload.lid;
  }

  const resolvedName = payload.pushName || payload.name;
  if (resolvedName && resolvedName !== contact.name) {
    updates.name = resolvedName;
  }

  if (Object.keys(updates).length) {
    await contact.update(updates);
  }
};

const mergeContacts = async (source: Contact, target: Contact) => {
  await Promise.all([
    Ticket.update({ contactId: target.id }, { where: { contactId: source.id } }),
    Message.update({ contactId: target.id }, { where: { contactId: source.id } }),
    Schedule.update({ contactId: target.id }, { where: { contactId: source.id } }),
    TicketNote.update({ contactId: target.id }, { where: { contactId: source.id } }),
    ContactCustomField.update({ contactId: target.id }, { where: { contactId: source.id } })
  ]);

  // Atualizar LID alvo se necessário
  if (!target.lid && source.lid) {
    await target.update({ lid: source.lid });
  }

  await source.destroy();
};
