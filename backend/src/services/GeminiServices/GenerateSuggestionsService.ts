import AppError from "../../errors/AppError";
import ShowSettingsService from "../SettingServices/ShowSettingsService";
import { cacheLayer } from "../../libs/cache";

interface Request {
  prompt: string;
  companyId: number;
}

// Cache de sugestões por prompt (TTL: 5 minutos)
const getCacheKey = (prompt: string, companyId: number): string => {
  return `gemini:suggestions:${companyId}:${prompt.toLowerCase().trim()}`;
};

const GenerateSuggestionsService = async ({
  prompt,
  companyId
}: Request): Promise<string[]> => {
  try {
    // Verificar cache primeiro
    const cacheKey = getCacheKey(prompt, companyId);
    const cachedSuggestions = await cacheLayer.get(cacheKey);
    
    if (cachedSuggestions) {
      console.log("Sugestões retornadas do cache para:", prompt);
      return JSON.parse(cachedSuggestions);
    }
    
    // Buscar o token do Gemini nas configurações
    let apiKey = null;
    try {
      const geminiTokenSetting = await ShowSettingsService({
        settingKey: "geminiApiToken",
        companyId
      });
      apiKey = geminiTokenSetting?.value;
    } catch (error) {
      // Configuração não encontrada
    }

    if (!apiKey) {
      throw new AppError("Token do Gemini não configurado. Configure no painel de administração.", 400);
    }

    // Buscar a versão do modelo configurada
    let geminiModelSetting = null;
    try {
      geminiModelSetting = await ShowSettingsService({
        settingKey: "geminiModel",
        companyId
      });
    } catch (error) {
      // Usar padrão se não configurado
    }

    // Modelo padrão ajustado para a versão suportada
    const model = geminiModelSetting?.value || "gemini-2.0-flash-exp";
    
    // Usar a API do Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Criar prompt para gerar 5 sugestões diferentes
    const systemPrompt = `Você é um assistente de atendimento ao cliente. 

INSTRUÇÕES IMPORTANTES:
- Gere exatamente 5 sugestões diferentes de mensagens
- Cada sugestão deve ser uma mensagem completa e independente
- As mensagens devem ser amigáveis, profissionais e apropriadas para atendimento
- Cada mensagem deve ter no máximo 100 caracteres
- NÃO use numeração, bullets, ou prefixos como "1.", "-", "*", etc.
- NÃO adicione explicações ou comentários
- Retorne APENAS as 5 mensagens, uma por linha

FORMATO DE RESPOSTA (exemplo):
Olá! Como posso ajudá-lo hoje?
Bem-vindo! Em que posso ser útil?
Oi! Estou aqui para ajudar.
Olá! Fico feliz em poder ajudar você.
Oi! Como posso tornar seu dia melhor?`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nContexto: ${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      }
    };

    // Retry com backoff exponencial para erro 429
    let response;
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo
    
    while (retries <= maxRetries) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          break; // Sucesso, sair do loop
        }

        // Se for erro 429 e ainda temos tentativas, aguardar e tentar novamente
        if (response.status === 429 && retries < maxRetries) {
          const delay = baseDelay * Math.pow(2, retries); // Backoff exponencial
          console.log(`Erro 429 detectado. Aguardando ${delay}ms antes de tentar novamente (tentativa ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          continue;
        }

        // Se não for 429 ou esgotamos as tentativas, tratar o erro
        let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error.message || errorData.error.status || errorMessage;
            console.error("Erro da API Gemini:", JSON.stringify(errorData, null, 2));
            
            // Mensagem mais amigável para erro 429
            if (response.status === 429 || errorMessage.includes("Resource exhausted") || errorMessage.includes("429")) {
              errorMessage = "Limite de requisições excedido. Por favor, aguarde alguns segundos antes de tentar novamente.";
            }
          }
        } catch (e) {
          const errorText = await response.text();
          console.error("Resposta de erro (texto):", errorText);
          errorMessage = errorText || errorMessage;
          
          if (response.status === 429) {
            errorMessage = "Limite de requisições excedido. Por favor, aguarde alguns segundos antes de tentar novamente.";
          }
        }
        throw new AppError(errorMessage, response.status);
      } catch (error: any) {
        // Se for erro de rede e ainda temos tentativas, tentar novamente
        if (retries < maxRetries && !error.status) {
          const delay = baseDelay * Math.pow(2, retries);
          console.log(`Erro de rede. Aguardando ${delay}ms antes de tentar novamente (tentativa ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          continue;
        }
        throw error;
      }
    }
    
    if (!response || !response.ok) {
      throw new AppError("Erro ao gerar sugestões após múltiplas tentativas", 500);
    }

    const data = await response.json();
    console.log("Resposta da API Gemini:", JSON.stringify(data, null, 2));

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Estrutura de resposta inválida:", JSON.stringify(data, null, 2));
      throw new AppError("Resposta inválida da API do Gemini: estrutura de dados não reconhecida", 500);
    }

    if (!data.candidates[0].content.parts || !data.candidates[0].content.parts[0] || !data.candidates[0].content.parts[0].text) {
      console.error("Texto não encontrado na resposta:", JSON.stringify(data.candidates[0], null, 2));
      throw new AppError("Resposta inválida da API do Gemini: texto não encontrado", 500);
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log("Texto gerado:", generatedText);

    // Processar a resposta para extrair as 5 sugestões
    let suggestions = generatedText
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .filter((line: string) => {
        // Remove numeração, bullets, e prefixos comuns
        return !line.match(/^[\d\-\*•\.\)]+[\s\.\)]/) && 
               !line.match(/^(Sugestão|Opção|Alternativa|Mensagem)\s*\d*:?\s*/i) &&
               line.length > 10; // Mínimo de caracteres
      })
      .map((line: string) => {
        // Remove prefixos comuns que podem ter sobrado
        return line.replace(/^[\d\-\*•\.\)\s]+/, '').trim();
      })
      .filter((line: string) => line.length > 0)
      .slice(0, 5); // Garantir apenas 5 sugestões

    console.log("Sugestões processadas:", suggestions);

    // Se não tiver 5 sugestões, completar com sugestões padrão baseadas no prompt
    const defaultSuggestions = [
      "Olá! Como posso ajudá-lo hoje?",
      "Bem-vindo! Em que posso ser útil?",
      "Oi! Estou aqui para ajudar. O que você precisa?",
      "Olá! Fico feliz em poder ajudar você hoje.",
      "Oi! Como posso tornar seu dia melhor?"
    ];

    // Se o prompt for específico, criar sugestões mais contextualizadas
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes("olá") || promptLower.includes("oi") || promptLower.includes("bom dia") || promptLower.includes("boa tarde") || promptLower.includes("boa noite")) {
      const contextualSuggestions = [
        "Olá! Como posso ajudá-lo hoje?",
        "Oi! Em que posso ser útil?",
        "Olá! Estou aqui para ajudar.",
        "Oi! Como posso tornar seu dia melhor?",
        "Olá! Fico feliz em poder ajudar você."
      ];
      while (suggestions.length < 5) {
        const randomDefault = contextualSuggestions[Math.floor(Math.random() * contextualSuggestions.length)];
        if (!suggestions.includes(randomDefault)) {
          suggestions.push(randomDefault);
        }
        // Evitar loop infinito
        if (suggestions.length >= 5) break;
      }
    } else {
      while (suggestions.length < 5) {
        const randomDefault = defaultSuggestions[Math.floor(Math.random() * defaultSuggestions.length)];
        if (!suggestions.includes(randomDefault)) {
          suggestions.push(randomDefault);
        }
        // Evitar loop infinito
        if (suggestions.length >= 5) break;
      }
    }

    // Garantir exatamente 5 sugestões
    while (suggestions.length < 5) {
      suggestions.push(defaultSuggestions[suggestions.length % defaultSuggestions.length]);
    }

    const finalSuggestions = suggestions.slice(0, 5);
    
    // Armazenar no cache (TTL: 5 minutos = 300 segundos)
    try {
      await cacheLayer.set(cacheKey, JSON.stringify(finalSuggestions), "EX", 300);
    } catch (cacheError) {
      console.error("Erro ao armazenar no cache:", cacheError);
      // Continuar mesmo se o cache falhar
    }
    
    return finalSuggestions;
  } catch (error: any) {
    console.error("Erro completo no GenerateSuggestionsService:", error);
    if (error instanceof AppError) {
      throw error;
    }
    const errorMessage = error?.message || error?.toString() || "Erro desconhecido";
    console.error("Mensagem de erro:", errorMessage);
    throw new AppError(`Erro ao gerar sugestões: ${errorMessage}`, 500);
  }
};

export default GenerateSuggestionsService;

