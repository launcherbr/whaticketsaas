import { Router } from "express";
import isAuth from "../middleware/isAuth";
import rateLimit from "express-rate-limit";
import * as GeminiController from "../controllers/GeminiController";

const geminiRoutes = Router();

// Rate limiting específico para Gemini: máximo 10 requisições por minuto por usuário
const geminiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requisições por minuto
  message: 'Muitas requisições ao Gemini. Aguarde um minuto antes de tentar novamente.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limit para localhost (desenvolvimento)
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
  keyGenerator: (req) => {
    // Usar companyId + userId para rate limiting por empresa/usuário
    const companyId = req.user?.companyId || req.ip;
    const userId = req.user?.id || 'anonymous';
    return `gemini:${companyId}:${userId}`;
  }
});

geminiRoutes.post("/gemini/suggestions", isAuth, geminiRateLimiter, GeminiController.generateSuggestions);

export default geminiRoutes;


