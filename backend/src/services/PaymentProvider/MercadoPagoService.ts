import { MercadoPagoConfig, Payment } from "mercadopago";
import AppError from "../../errors/AppError";
import ShowSettingsService from "../SettingServices/ShowSettingsService";
import { logger } from "../../utils/logger";

interface CreatePixPaymentParams {
  companyId: number;
  amount: number;
  description: string;
  invoiceId: number;
  payerEmail: string;
  payerFirstName?: string;
  payerLastName?: string;
  webhookUrl: string;
}

interface CreatePixPaymentResponse {
  paymentId: string;
  pixCopyPaste: string;
  qrCodeBase64: string;
  expiresAt?: string;
}

const SUPER_ADMIN_COMPANY_ID = Number(process.env.SUPER_ADMIN_COMPANY_ID || 1);

const getAccessToken = async (): Promise<string> => {
  const superAdminAccessTokenSetting = await ShowSettingsService({
    settingKey: "mercadoPagoAccessToken",
    companyId: SUPER_ADMIN_COMPANY_ID
  }).catch(() => null);

  const accessToken = superAdminAccessTokenSetting?.value || process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new AppError("Token de acesso do Mercado Pago não configurado.", 400);
  }

  return accessToken;
};

const getMercadoPagoClient = async (): Promise<Payment> => {
  const accessToken = await getAccessToken();
  const config = new MercadoPagoConfig({ accessToken });
  return new Payment(config);
};

export const createPixPayment = async ({
  companyId,
  amount,
  description,
  invoiceId,
  payerEmail,
  payerFirstName,
  payerLastName,
  webhookUrl
}: CreatePixPaymentParams): Promise<CreatePixPaymentResponse> => {
  logger.info({
    message: "MercadoPagoService.createPixPayment:init",
    companyId,
    amount,
    invoiceId,
    payerEmail,
    webhookUrl
  });

  const paymentClient = await getMercadoPagoClient();

  let payment;

  try {
    payment = await paymentClient.create({
      body: {
        transaction_amount: Number(amount),
        description,
        payment_method_id: "pix",
        notification_url: webhookUrl,
        external_reference: String(invoiceId),
        payer: {
          email: payerEmail,
          first_name: payerFirstName,
          last_name: payerLastName
        }
      }
    });
  } catch (error: any) {
    logger.error({
      message: "MercadoPagoService.createPixPayment:error",
      errorMessage: error?.message,
      errorResponse: error?.response ? JSON.stringify(error.response, null, 2) : undefined,
      errorCause: error
    });
    throw error;
  }

  const transactionData = payment.point_of_interaction?.transaction_data;

  if (!transactionData?.qr_code) {
    logger.error({
      message: "MercadoPagoService.createPixPayment:missing_qr_code",
      paymentId: payment?.id,
      paymentStatus: payment?.status,
      paymentResponse: JSON.stringify(payment)
    });
    throw new AppError("Não foi possível gerar o PIX do Mercado Pago.", 500);
  }

  logger.info({
    message: "MercadoPagoService.createPixPayment:success",
    paymentId: payment.id,
    status: payment.status
  });

  return {
    paymentId: String(payment.id),
    pixCopyPaste: transactionData.qr_code,
    qrCodeBase64: transactionData.qr_code_base64 || "",
    expiresAt: payment.date_of_expiration || undefined
  };
};

export const getPaymentById = async (companyId: number, paymentId: string) => {
  const paymentClient = await getMercadoPagoClient();
  const payment = await paymentClient.get({ id: paymentId });
  return payment;
};

export default {
  createPixPayment,
  getPaymentById
};
