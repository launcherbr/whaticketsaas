import CryptoJS from 'crypto-js';

/**
 * Classe para lidar com criptografia nos sockets do lado do cliente
 */
class SocketCrypto {
  /**
   * Inicializa o sistema de criptografia para o cliente
   * @param {string} secretKey - Opcional: chave secreta para criptografia
   */
  constructor(secretKey = null) {
    // Usar uma chave predefinida ou gerar uma (idealmente deveria vir do servidor)
    this.secretKey = secretKey || 'whaticket-crypto-secret-key';
  }

  /**
   * Descriptografa dados recebidos do servidor
   * @param {Object} packet - Pacote criptografado com event, encrypted, iv
   * @returns {Object} - Evento e payload descriptografado
   */
  decryptPacket(packet) {
    try {
      const { event, encrypted, iv } = packet;
      
      if (!encrypted || !iv) {
        throw new Error('Pacote inválido: dados ou IV ausentes');
      }
      
      // Converter IV de hexadecimal para WordArray
      const ivWordArray = CryptoJS.enc.Hex.parse(iv);
      
      // Descriptografar os dados
      const decrypted = CryptoJS.AES.decrypt(
        encrypted,
        CryptoJS.SHA256(this.secretKey), // Usar SHA-256 da chave como no backend
        { iv: ivWordArray }
      );
      
      // Converter para string
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Converter para objeto
      const payload = JSON.parse(decryptedStr);
      
      return { event, payload };
    } catch (error) {
      console.error('Erro ao descriptografar pacote:', error);
      throw new Error(`Falha na descriptografia: ${error.message}`);
    }
  }

  /**
   * Criptografa dados para envio ao servidor
   * @param {string} event - Nome do evento
   * @param {any} payload - Dados a serem criptografados
   * @returns {Object} - Pacote criptografado
   */
  encryptPacket(event, payload) {
    try {
      // Gerar IV aleatório
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Converter payload para string JSON
      const payloadStr = JSON.stringify(payload);
      
      // Criptografar os dados
      const encrypted = CryptoJS.AES.encrypt(
        payloadStr,
        CryptoJS.SHA256(this.secretKey), // Usar SHA-256 da chave como no backend
        { iv: iv }
      );
      
      return {
        event,
        encrypted: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Hex)
      };
    } catch (error) {
      console.error('Erro ao criptografar pacote:', error);
      throw new Error(`Falha na criptografia: ${error.message}`);
    }
  }

  /**
   * Verifica se um evento está criptografado
   * @param {string} eventName - Nome do evento
   * @returns {boolean} - true se o evento estiver criptografado
   */
  isEncryptedEvent(eventName) {
    return typeof eventName === 'string' && eventName.startsWith('encrypted:');
  }

  /**
   * Extrai o nome original do evento de um evento criptografado
   * @param {string} encryptedEventName - Nome do evento criptografado
   * @returns {string} - Nome original do evento
   */
  getOriginalEventName(encryptedEventName) {
    return encryptedEventName.replace('encrypted:', '');
  }
}

export default SocketCrypto; 