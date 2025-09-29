import axios from 'axios';

interface VersionInfo {
  version: string;
  beta: boolean;
  released: string;
  expire: string;
}

interface VersionsResponse {
  currentBeta: string | null;
  currentVersion: string;
  versions: VersionInfo[];
}

/**
 * Função que faz GET na URL e busca qualquer posição do array
 * Retorna no formato [major, minor, patch] para WAVersion
 */
export async function getVersionByIndexFromUrl(index: number = 2): Promise<[number, number, number]> {
  try {
    const url = 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/versions.json';
    
    const response = await axios.get<VersionsResponse>(url);
    const versionsData = response.data;

    if (!versionsData.versions || versionsData.versions.length <= index) {
      throw new Error(`Array versions deve ter pelo menos ${index + 1} itens`);
    }

    const versionItem = versionsData.versions[index];
    
    if (!versionItem || !versionItem.version) {
      throw new Error(`Item na posição ${index} não encontrado ou sem versão válida`);
    }

    // Remove o sufixo -alpha
    const versionWithoutAlpha = versionItem.version.replace('-alpha', '');
    
    // Converte para array de números
    const [major, minor, patch] = versionWithoutAlpha.split('.').map(Number);
    
    return [major, minor, patch];
    
  } catch (error) {
    console.error('Erro ao buscar versão da URL:', error);
    throw error;
  }
}

