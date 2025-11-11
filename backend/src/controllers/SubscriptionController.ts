import { Request, Response } from "express";
import express from "express";
import * as Yup from "yup";
import Gerencianet from "gn-api-sdk-typescript";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AppError from "../errors/AppError";

import Company from "../models/Company";
import Invoices from "../models/Invoices";
import Subscriptions from "../models/Subscriptions";
import { getIO } from "../libs/socket";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowSettingsService from "../services/SettingServices/ShowSettingsService";
import MercadoPagoService from "../services/PaymentProvider/MercadoPagoService";
import User from "../models/User";
import { logger } from "../utils/logger";

const app = express();

const getRequestRawBody = (req: Request): string => {
  const raw = (req as any).rawBody;
  if (typeof raw === "string") {
    return raw;
  }
  if (Buffer.isBuffer(raw)) {
    return raw.toString("utf-8");
  }
  return JSON.stringify(req.body ?? {});
};

const timingSafeCompare = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const parseSignatureHeader = (headerValue: string): Record<string, string> => {
  return headerValue.split(",").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, rawValue] = part.split("=");
    if (!rawKey || !rawValue) {
      return acc;
    }
    const key = rawKey.trim();
    const value = rawValue.trim();
    if (key && value) {
      acc[key] = value.replace(/^"|"$/g, "");
    }
    return acc;
  }, {});
};

const normalizeHash = (hash: string): string => hash.replace(/^sha256=/i, "").trim();

const verifyMercadoPagoSignature = (req: Request, rawBody: string): boolean => {
  const signatureHeader = req.headers["x-signature"];
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    logger.error({
      message: "Assinatura secreta do webhook Mercado Pago não configurada.",
      hint: "Defina MERCADO_PAGO_WEBHOOK_SECRET nas variáveis de ambiente."
    });
    throw new AppError("Configuração do webhook do Mercado Pago ausente.", 500);
  }

  if (!signatureHeader || Array.isArray(signatureHeader)) {
    logger.warn({
      message: "Cabeçalho de assinatura do Mercado Pago ausente ou inválido."
    });
    return false;
  }

  const parsed = parseSignatureHeader(signatureHeader);
  const timestamp = parsed.ts || parsed.time || parsed.timestamp;
  const providedSignature = parsed.v1 || parsed.signature || parsed.hash;

  if (!timestamp || !providedSignature) {
    logger.warn({
      message: "Assinatura do Mercado Pago sem campos obrigatórios.",
      parsedHeader: parsed
    });
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const normalizedProvided = normalizeHash(providedSignature);

  return timingSafeCompare(normalizedProvided, expectedSignature);
};

const verifyGerencianetSignature = (
  req: Request,
  rawBody: string,
  clientSecret: string
): boolean => {
  const possibleHeaders = [
    req.headers["x-hub-signature"],
    req.headers["x-hub-signature-256"],
    req.headers["x-sgn"]
  ];

  const signatureHeader = possibleHeaders.find(Boolean);

  if (!signatureHeader || Array.isArray(signatureHeader)) {
    logger.warn({
      message: "Cabeçalho de assinatura do Gerencianet ausente ou inválido."
    });
    return false;
  }

  const providedSignature = signatureHeader.toString();
  const normalizedProvided = normalizeHash(providedSignature);
  const expectedSignature = crypto.createHmac("sha256", clientSecret).update(rawBody).digest("hex");

  return timingSafeCompare(normalizedProvided, expectedSignature);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { options: gerencianetOptions } = await getGerencianetSettings();
  const gerencianet = Gerencianet(gerencianetOptions);
  return res.json(gerencianet.getSubscriptions());
};

const SUPER_ADMIN_COMPANY_ID = Number(process.env.SUPER_ADMIN_COMPANY_ID || 1);

const resolveSubscriptionPaymentProvider = async (companyId: number): Promise<string> => {
  const companySetting = await ShowSettingsService({
    settingKey: "subscriptionPaymentProvider",
    companyId
  }).catch(() => null);

  if (companySetting?.value) {
    return String(companySetting.value).toLowerCase();
  }

  const superAdminSetting = await ShowSettingsService({
    settingKey: "subscriptionPaymentProvider",
    companyId: SUPER_ADMIN_COMPANY_ID
  }).catch(() => null);

  if (superAdminSetting?.value) {
    return String(superAdminSetting.value).toLowerCase();
  }

  return process.env.SUBSCRIPTION_PAYMENT_PROVIDER?.toLowerCase() || "gerencianet";
};

const parseBoolean = (value?: string | null): boolean => {
  if (!value) {
    return false;
  }

  const normalized = value.toString().trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(normalized);
};

const getSettingValue = async (key: string): Promise<string | undefined> => {
  const setting = await ShowSettingsService({
    settingKey: key,
    companyId: SUPER_ADMIN_COMPANY_ID
  }).catch(() => null);

  return setting?.value;
};

interface GerencianetSettings {
  options: {
    sandbox: boolean;
    client_id: string;
    client_secret: string;
    pix_cert: string;
  };
  pixKey: string;
}

const getGerencianetSettings = async (): Promise<GerencianetSettings> => {
  const sandboxSetting = await getSettingValue("gerencianetSandbox");
  const clientIdSetting = await getSettingValue("gerencianetClientId");
  const clientSecretSetting = await getSettingValue("gerencianetClientSecret");
  const pixCertSetting = await getSettingValue("gerencianetPixCert");
  const pixKeySetting = await getSettingValue("gerencianetPixKey");

  const envSandbox = process.env.GERENCIANET_SANDBOX;
  const sandbox = sandboxSetting != null ? parseBoolean(sandboxSetting) : parseBoolean(envSandbox);

  const clientId = clientIdSetting || process.env.GERENCIANET_CLIENT_ID;
  const clientSecret = clientSecretSetting || process.env.GERENCIANET_CLIENT_SECRET;
  const pixCertBase = pixCertSetting || process.env.GERENCIANET_PIX_CERT;
  const pixKey = pixKeySetting || process.env.GERENCIANET_PIX_KEY;

  if (!clientId || !clientSecret || !pixCertBase || !pixKey) {
    throw new AppError(
      "Configurações do Gerencianet não estão completas. Verifique Client ID, Client Secret, certificado e chave PIX.",
      400
    );
  }

  const pixCertPath = path.resolve(__dirname, `../../certs/${pixCertBase}.p12`);

  if (!fs.existsSync(pixCertPath)) {
    throw new AppError(
      "Certificado do Gerencianet não encontrado. Envie o arquivo .p12 nas configurações.",
      400
    );
  }

  return {
    options: {
      sandbox,
      client_id: clientId,
      client_secret: clientSecret,
      pix_cert: pixCertPath
    },
    pixKey
  };
};

const ensureGerencianetWebhook = async (gerencianetClient: any, pixKey: string, webhookUrl: string) => {
  try {
    await gerencianetClient.pixConfigWebhook(
      { chave: pixKey },
      { webhookUrl }
    );
  } catch (error: any) {
    const status = error?.response?.status;
    logger.warn({
      message: "Falha ao configurar webhook do Gerencianet. Verifique manualmente.",
      status,
      errorMessage: error?.message,
      errorResponse: error?.response?.data
    });
  }
};

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, id: userId } = req.user;

  const schema = Yup.object().shape({
    price: Yup.string().required(),
    users: Yup.string().required(),
    connections: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("Validation fails", 400);
  }

  const {
    firstName,
    lastName,
    email,
    price,
    users,
    connections,
    invoiceId
  } = req.body;

  const invoice = await Invoices.findByPk(invoiceId);

  if (!invoice || invoice.companyId !== companyId) {
    throw new AppError("Fatura não encontrada.", 404);
  }

  let payerEmail = email;
  if (!payerEmail) {
    const user = await User.findByPk(userId);
    payerEmail = user?.email || undefined;
  }

  if (!payerEmail) {
    throw new AppError("E-mail do pagador é obrigatório.", 400);
  }

  const paymentProvider = await resolveSubscriptionPaymentProvider(companyId);

  if (paymentProvider === "mercadopago") {
    const webhookUrl = process.env.MERCADO_PAGO_WEBHOOK_URL || `${process.env.BACKEND_URL}/subscription/webhook/mercadopago`;

    const payment = await MercadoPagoService.createPixPayment({
      companyId,
      amount: Number(price),
      description: `Plano ${connections} conexões / ${users} usuários`,
      invoiceId,
      payerEmail,
      payerFirstName: firstName,
      payerLastName: lastName,
      webhookUrl
    });

    await invoice.update({
      paymentProvider: "mercadopago",
      providerPaymentId: payment.paymentId,
      pixCopyPaste: payment.pixCopyPaste,
      qrCodeBase64: payment.qrCodeBase64,
      payerEmail
    });

    return res.json({
      provider: "mercadopago",
      valor: {
        original: Number(price)
      },
      qrcode: {
        qrcode: payment.pixCopyPaste,
        imagemQrcode: payment.qrCodeBase64
      },
      expiresAt: payment.expiresAt
    });
  }

  const { options: gerencianetOptions, pixKey } = await getGerencianetSettings();
  const gerencianet = Gerencianet(gerencianetOptions);
  const gerencianetWebhookUrl =
    process.env.GERENCIANET_WEBHOOK_URL || `${process.env.BACKEND_URL}/subscription/webhook`;

  await ensureGerencianetWebhook(gerencianet, pixKey, gerencianetWebhookUrl);

  const body = {
    calendario: {
      expiracao: 3600
    },
    valor: {
      original: Number(price)
        .toLocaleString("pt-br", { minimumFractionDigits: 2 })
        .replace(",", ".")
    },
    chave: pixKey,
    solicitacaoPagador: `#Fatura:${invoiceId}`
  };

  try {
    const pix = await gerencianet.pixCreateImmediateCharge(null, body);

    const qrcode = await gerencianet.pixGenerateQRCode({
      id: pix.loc.id
    });

    await invoice.update({
      paymentProvider: "gerencianet",
      providerPaymentId: pix.txid || pix.loc?.id || null,
      pixCopyPaste: qrcode.qrcode,
      qrCodeBase64: qrcode.imagemQrcode,
      payerEmail
    });

    return res.json({
      ...pix,
      qrcode
    });
  } catch (error) {
    throw new AppError("Não foi possível gerar o PIX.", 400);
  }
};

export const createWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schema = Yup.object().shape({
    chave: Yup.string().required(),
    url: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("Validation fails", 400);
  }

  const { chave, url } = req.body;

  const body = {
    webhookUrl: url
  };

  const params = {
    chave
  };

  try {
    const { options: gerencianetOptions } = await getGerencianetSettings();
    const gerencianet = Gerencianet(gerencianetOptions);
    const create = await gerencianet.pixConfigWebhook(params, body);
    return res.json(create);
  } catch (error: any) {
    logger.error({
      message: "Falha ao registrar webhook do Gerencianet via endpoint manual.",
      errorMessage: error?.message,
      errorResponse: error?.response?.data
    });
    throw new AppError("Não foi possível registrar o webhook do Gerencianet.", 400);
  }
};

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const rawBody = getRequestRawBody(req);
  const { type } = req.params;

  if (type === "mercadopago") {
    const isValidSignature = verifyMercadoPagoSignature(req, rawBody);

    if (!isValidSignature) {
      logger.warn({
        message: "Assinatura do webhook Mercado Pago inválida."
      });
      return res.status(401).json({ ok: false });
    }

    const paymentId = (req.query["data.id"] as string) || req.body?.data?.id || req.body?.id;

    if (!paymentId) {
      return res.json({ ok: true });
    }

    const invoice = await Invoices.findOne({
      where: { providerPaymentId: String(paymentId) }
    });

    if (!invoice) {
      return res.json({ ok: true });
    }

    if (invoice.status === "paid") {
      logger.info({
        message: "Webhook Mercado Pago ignorado: fatura já processada.",
        invoiceId: invoice.id
      });
      return res.json({ ok: true });
    }

    const payment = await MercadoPagoService.getPaymentById(invoice.companyId, String(paymentId));

    if (payment && payment.status === "approved") {
      const company = await Company.findByPk(invoice.companyId);

      if (company) {
        let dueDateBase = company.dueDate ? new Date(company.dueDate) : new Date();
        if (Number.isNaN(dueDateBase.getTime())) {
          dueDateBase = new Date();
        }
        dueDateBase.setDate(dueDateBase.getDate() + 30);
        const date = dueDateBase.toISOString().split("T")[0];

        await company.update({
          dueDate: date
        });

        await invoice.update({
          status: "paid"
        });

        await company.reload();

        const io = getIO();
        io.to(`company-${invoice.companyId}-mainchannel`).emit(`company-${invoice.companyId}-payment`, {
          action: "CONCLUIDA",
          company
        });
      }
    }

    return res.json({ ok: true });
  }

  const gerencianetSettings = await getGerencianetSettings();
  const gerencianetSecret = gerencianetSettings.options.client_secret;

  if (!verifyGerencianetSignature(req, rawBody, gerencianetSecret)) {
    logger.warn({
      message: "Assinatura do webhook Gerencianet inválida."
    });
    return res.status(401).json({ ok: false });
  }

  const { evento } = req.body;
  if (evento === "teste_webhook") {
    return res.json({ ok: true });
  }
  if (Array.isArray(req.body.pix)) {
    const gerencianet = Gerencianet(gerencianetSettings.options);

    for (const pix of req.body.pix) {
      try {
        const detail = await gerencianet.pixDetailCharge({
          txid: pix.txid
        });

        if (detail.status !== "CONCLUIDA") {
          continue;
        }

        const invoiceIdFromRequest = detail.solicitacaoPagador?.replace("#Fatura:", "");

        if (!invoiceIdFromRequest) {
          logger.warn({
            message: "Webhook Gerencianet sem identificação de fatura.",
            pixTxid: pix.txid
          });
          continue;
        }

        const invoice = await Invoices.findByPk(invoiceIdFromRequest);

        if (!invoice) {
          logger.warn({
            message: "Fatura informada no webhook Gerencianet não encontrada.",
            invoiceId: invoiceIdFromRequest
          });
          continue;
        }

        if (invoice.status === "paid") {
          logger.info({
            message: "Webhook Gerencianet ignorado: fatura já processada.",
            invoiceId: invoice.id
          });
          continue;
        }

        const company = await Company.findByPk(invoice.companyId);

        if (!company) {
          logger.warn({
            message: "Empresa vinculada à fatura não encontrada.",
            companyId: invoice.companyId
          });
          continue;
        }

        let dueDateBase = company.dueDate ? new Date(company.dueDate) : new Date();
        if (Number.isNaN(dueDateBase.getTime())) {
          dueDateBase = new Date();
        }
        dueDateBase.setDate(dueDateBase.getDate() + 30);
        const date = dueDateBase.toISOString().split("T")[0];

        await company.update({
          dueDate: date
        });

        await invoice.update({
          status: "paid"
        });

        await company.reload();
        const io = getIO();
        const companyUpdate = await Company.findOne({
          where: {
            id: invoice.companyId
          }
        });

        io.to(`company-${invoice.companyId}-mainchannel`).emit(`company-${invoice.companyId}-payment`, {
          action: detail.status,
          company: companyUpdate
        });
      } catch (error: any) {
        logger.error({
          message: "Erro ao processar webhook Gerencianet.",
          errorMessage: error?.message,
          pixTxid: pix?.txid,
          errorResponse: error?.response?.data
        });
      }
    }
  }

  return res.json({ ok: true });
};
