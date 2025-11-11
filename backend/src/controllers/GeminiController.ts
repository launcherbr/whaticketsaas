import { Request, Response } from "express";
import AppError from "../errors/AppError";
import GenerateSuggestionsService from "../services/GeminiServices/GenerateSuggestionsService";

export const generateSuggestions = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { prompt } = req.body;
  const { companyId } = req.user;

  if (!prompt) {
    throw new AppError("Prompt é obrigatório", 400);
  }

  try {
    const suggestions = await GenerateSuggestionsService({
      prompt,
      companyId
    });

    return res.status(200).json({ suggestions });
  } catch (error: any) {
    console.error("Erro no controller Gemini:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ 
        error: error.message,
        statusCode: error.statusCode 
      });
    }
    const errorMessage = error?.message || error?.toString() || "Erro desconhecido ao gerar sugestões";
    return res.status(500).json({ 
      error: errorMessage,
      statusCode: 500
    });
  }
};


