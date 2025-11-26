import { head } from "lodash";
import XLSX from "xlsx";
import { has } from "lodash";
import ContactListItem from "../../models/ContactListItem";
import CheckContactNumber from "../WbotServices/CheckNumber";
import { logger } from "../../utils/logger";

export async function ImportContacts(
  contactListId: number,
  companyId: number,
  file: Express.Multer.File | undefined
) {
  const workbook = XLSX.readFile(file?.path as string);
  const worksheet = head(Object.values(workbook.Sheets)) as any;
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
  const contacts = rows.map(row => {
    let name = "";
    let number = "";
    let email = "";

    if (has(row, "nome") || has(row, "Nome")) {
      name = row["nome"] || row["Nome"];
    }

    if (
      has(row, "numero") ||
      has(row, "número") ||
      has(row, "Numero") ||
      has(row, "Número")
    ) {
      number = row["numero"] || row["número"] || row["Numero"] || row["Número"];
      // CORREÇÃO PARTE 1: Não cortar cegamente na importação
      number = `${number}`.replace(/\D/g, ""); 
    }

    if (
      has(row, "email") ||
      has(row, "e-mail") ||
      has(row, "Email") ||
      has(row, "E-mail")
    ) {
      email = row["email"] || row["e-mail"] || row["Email"] || row["E-mail"];
    }

    return { name, number, email, contactListId, companyId };
  });

  const contactList: ContactListItem[] = [];

  for (const contact of contacts) {
    const [newContact, created] = await ContactListItem.findOrCreate({
      where: {
        number: `${contact.number}`,
        contactListId: contact.contactListId,
        companyId: contact.companyId
      },
      defaults: contact
    });
    if (created) {
      contactList.push(newContact);
    }
  }

  if (contactList) {
    for (let newContact of contactList) {
      try {
        const response = await CheckContactNumber(newContact.number, companyId);
        newContact.isWhatsappValid = response.exists;
        
        // CORREÇÃO PARTE 2: Lógica Híbrida após validação
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
                 number = number.slice(0, 4) + number.slice(5);
               }
            } else {
               number = number.slice(0, 12);
            }
          }
        } else {
          number = number.slice(0, 12);
        }

        newContact.number = number;
        await newContact.save();
      } catch (e) {
        logger.error(`Número de contato inválido: ${newContact.number}`);
      }
    }
  }

  return contactList;
}
