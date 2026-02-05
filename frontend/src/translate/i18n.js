import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { messages } from "./languages";

// Obter idioma do localStorage ou usar pt como padrão
let savedLanguage = localStorage.getItem("i18nextLng");

// Normalizar pt-BR para pt
if (savedLanguage === "pt-BR") {
	savedLanguage = "pt";
	localStorage.setItem("i18nextLng", "pt");
}

// Validar idioma
const availableLanguages = ["pt", "en", "es"];

// Se não tiver idioma salvo ou for inválido, usa pt como padrão
if (!savedLanguage || !availableLanguages.includes(savedLanguage)) {
	savedLanguage = "pt";
	localStorage.setItem("i18nextLng", "pt");
}

// Inicializar o i18n
i18n.use(LanguageDetector).init({
	debug: false,
	defaultNS: "translations",
	fallbackLng: "pt",
	ns: ["translations"],
	resources: messages,
	lng: savedLanguage,
	interpolation: {
		escapeValue: false,
	},
	react: {
		useSuspense: false,
	},
	detection: {
		order: ["localStorage", "navigator"],
		caches: ["localStorage"],
		lookupLocalStorage: "i18nextLng",
	},
	keySeparator: ".",
	nsSeparator: ":",
	initImmediate: true,
});

// Função para inicializar o idioma do backend (será chamada após login)
export const initializeLanguageFromBackend = async () => {
	try {
		// Importar api dinamicamente para evitar dependência circular
		const api = (await import("../services/api")).default;
		
		// Tenta buscar o idioma do usuário primeiro
		try {
			const { data: userData } = await api.get("/users/me/language");
			const userLanguage = userData.language;
			
			if (userLanguage && userLanguage.trim() !== "") {
				const validLanguages = ["pt", "en", "es"];
				const languageString = String(userLanguage).trim();
				
				if (validLanguages.includes(languageString)) {
					localStorage.setItem("i18nextLng", languageString);
					// Só muda se for diferente do atual
					if (i18n.language !== languageString) {
						await i18n.changeLanguage(languageString);
					}
					return languageString;
				}
			}
		} catch (err) {
			console.error("Erro ao buscar idioma do usuário:", err);
		}

		// Se o usuário não tem idioma definido, busca o padrão do sistema
		try {
			const { data: systemData } = await api.get("/settings/system-default-language");
			const systemLanguage = systemData.language || "pt";
			const validLanguages = ["pt", "en", "es"];
			const languageString = String(systemLanguage).trim();
			
			if (validLanguages.includes(languageString)) {
				localStorage.setItem("i18nextLng", languageString);
				if (i18n.language !== languageString) {
					await i18n.changeLanguage(languageString);
				}
				return languageString;
			}
		} catch (err) {
			// Se não for superadmin ou houver erro, usa o localStorage
			console.error("Erro ao buscar idioma padrão do sistema:", err);
		}
	} catch (err) {
		console.error("Erro ao inicializar idioma do backend:", err);
	}
	
	// Fallback: usa o localStorage ou pt
	const fallbackLanguage = localStorage.getItem("i18nextLng") || "pt";
	const validLanguages = ["pt", "en", "es"];
	const finalLanguage = validLanguages.includes(fallbackLanguage) ? fallbackLanguage : "pt";
	
	localStorage.setItem("i18nextLng", finalLanguage);
	if (i18n.language !== finalLanguage) {
		await i18n.changeLanguage(finalLanguage);
	}
	return finalLanguage;
};

// Garantir que o idioma seja o salvo no localStorage (não resetar)
// Isso garante que mesmo após reload, o idioma seja mantido
if (savedLanguage && i18n.language !== savedLanguage) {
	i18n.changeLanguage(savedLanguage).catch(() => {
		// Se falhar, mantém o que está
		console.warn("Não foi possível aplicar o idioma salvo:", savedLanguage);
	});
}

export { i18n };
