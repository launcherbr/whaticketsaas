import { head, has } from "lodash";
import XLSX from "xlsx";
import fs from "fs";
import { parse as csvParse } from "csv";
import Contact from "../../models/Contact";
import CheckContactNumber from "../WbotServices/CheckNumber";
import { logger } from "../../utils/logger";

export async function ImportContacts(
  companyId: number,
  file: Express.Multer.File | undefined
) {
  const filePath = file?.path as string;
  const originalName = (file?.originalname || "").toLowerCase();

  const mapRowToContact = (row: any) => {
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
      // Suporta números de qualquer país (até 15 dígitos conforme padrão internacional)
      number = `${number}`.replace(/\D/g, "").slice(0, 15);
    }

    if (
      has(row, "email") ||
      has(row, "e-mail") ||
      has(row, "Email") ||
      has(row, "E-mail")
    ) {
      email = row["email"] || row["e-mail"] || row["Email"] || row["E-mail"];
    }

    return { name, number, email, companyId };
  };

  let contactsRaw: any[] = [];

  // Suporte a CSV e a planilhas Excel (.xls, .xlsx)
  const isCsv = originalName.endsWith(".csv");

  if (isCsv) {
    let content = fs.readFileSync(filePath, "utf8");
    // Remove BOM UTF-8 se existir, para evitar erros "Invalid Opening Quote"
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }
    await new Promise<void>((resolve, reject) => {
      csvParse(
        content,
        { columns: true, delimiter: content.includes(";") ? ";" : "," },
        (err, records: any[]) => {
          if (err) {
            return reject(err);
          }
          contactsRaw = records;
          resolve();
        }
      );
    });
  } else {
    const workbook = XLSX.readFile(filePath);
    const worksheet = head(Object.values(workbook.Sheets)) as any;
    contactsRaw = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
  }

  const contacts = contactsRaw.map(mapRowToContact);

  const contactList: Contact[] = [];

  for (const contact of contacts) {
    const [newContact, created] = await Contact.findOrCreate({
      where: {
        number: `${contact.number}`,
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
        // Suporta números de qualquer país (até 15 dígitos conforme padrão internacional)
        const number = response.jid.replace(/\D/g, "").slice(0, 15);
        newContact.number = number;
        await newContact.save();
      } catch (e) {
        logger.error(`Número de contato inválido: ${newContact.number}`);
      }
    }
  }

  // Remove arquivo temporário após o processamento
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return contactList;
}
