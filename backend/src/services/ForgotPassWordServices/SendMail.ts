import nodemailer from "nodemailer";
import sequelize from "sequelize";
import database from "../../database";
import { config } from "dotenv";
config();

interface UserData {
  companyId: number;
}

// 1. Correção de Segurança: Uso de 'replacements' para evitar SQL Injection
const filterEmail = async (email: string) => {
  const sql = `SELECT * FROM "Users" WHERE email = :email`;
  const result = await database.query(sql, {
    replacements: { email },
    type: sequelize.QueryTypes.SELECT
  });
  return { hasResult: result.length > 0, data: [result] };
};

// 1. Correção de Segurança: Uso de 'replacements' para evitar SQL Injection
const insertToken = async (email: string, tokenSenha: string) => {
  const sqls = `UPDATE "Users" SET "resetPassword" = :tokenSenha WHERE email = :email`;
  const results = await database.query(sqls, {
    replacements: { email, tokenSenha },
    type: sequelize.QueryTypes.UPDATE
  });
  return { hasResults: results.length > 0, datas: results };
};

const SendMail = async (email: string, tokenSenha: string) => {
  const { hasResult, data } = await filterEmail(email);

  if (!hasResult) {
    return { status: 404, message: "Email não encontrado" };
  }

  const userData = data[0][0] as UserData;
  if (!userData || userData.companyId === undefined) {
    return { status: 404, message: "Dados do usuário não encontrados" };
  }

  // 3. Removido o 'if (hasResult === true)' redundante. O código só chega aqui se for válido.
  
  const companyName = process.env.COMPANY_NAME || "Whaticket";
  const logo = `${process.env.BACKEND_URL}/public/logotipos/login.png`;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: true, // Certifique-se de que a porta SMTP configurada suporta 'secure: true' (geralmente porta 465)
    auth: { 
        user: process.env.MAIL_USER, 
        pass: process.env.MAIL_PASS 
    }
  });

  await insertToken(email, tokenSenha);

  // 2. Correção no Fluxo Assíncrono: Removida a declaração de função desnecessária
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: `Redefinição de Senha - ${companyName}`,
      html: `
      <!-- Coloque aqui todo o código HTML do seu e-mail da Versão 1 -->
      <div style="text-align: center;">
        <img src="${logo}" alt="Logo ${companyName}" class="logo" style="width: 200px;">
        <h1>Bem-vindo à ${companyName}</h1>
        <p>Você solicitou recuperação de senha!</p>
        <h2>Código de Verificação:</h2>
        <p>${tokenSenha}</p>
      </div>`
    };

    // Agora o código de fato aguarda o envio do e-mail para continuar
    const info = await transporter.sendMail(mailOptions);
    console.log("E-mail enviado: " + info.response);
    
    return { status: 200, message: "E-mail de recuperação enviado com sucesso" };
    
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return { status: 500, message: "Ocorreu um erro interno ao tentar enviar o e-mail." };
  }
};

export default SendMail;