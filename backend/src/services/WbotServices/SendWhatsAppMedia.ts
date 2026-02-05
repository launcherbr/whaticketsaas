import { WAMessage, AnyMessageContent } from "baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import Sticker from "../../models/Sticker";
import mime from "mime-types";

import ffmpegPath from "ffmpeg-static";
import formatBody from "../../helpers/Mustache";
import { buildContactAddress } from "../../utils/global";
import { verifyMessage } from "./wbotMessageListener";
import { ensureFolderPermissions, ensureFilePermissions } from "../../helpers/EnsurePermissions";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  companyId?: number;
  body?: string;
  isForwarded?: boolean;
  forceMediaType?: string; // Força o tipo de mídia (ex: "document")
  skipSave?: boolean; // Se true, não salva o arquivo novamente (já está salvo)
}


ffmpeg.setFfmpegPath(ffmpegPath);

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (audio: string, companyId: string): Promise<string> => {
  const outputAudio = `${publicFolder}/company${companyId}/${new Date().getTime()}.ogg`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath} -i ${audio} -vn -c:a libopus -b:a 128k ${outputAudio} -y`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        fs.unlinkSync(audio);
        
        // CORRIGIR PERMISSÕES DO ARQUIVO DE ÁUDIO CONVERTIDO
        try {
          if (fs.existsSync(outputAudio)) {
            fs.chmodSync(outputAudio, 0o777);
          }
        } catch (err) {
          console.log(`Aviso: Não foi possível alterar permissões do áudio: ${outputAudio}`);
        }
        
        resolve(outputAudio);
      }
    );
  });
};

const processAudioFile = async (audio: string, companyId: string): Promise<string> => {
  const outputAudio = `${publicFolder}/company${companyId}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath} -i ${audio} -vn -ar 44100 -ac 2 -b:a 192k ${outputAudio}`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        fs.unlinkSync(audio);
        
        // CORRIGIR PERMISSÕES DO ARQUIVO DE ÁUDIO CONVERTIDO
        try {
          if (fs.existsSync(outputAudio)) {
            fs.chmodSync(outputAudio, 0o777);
          }
        } catch (err) {
          console.log(`Aviso: Não foi possível alterar permissões do áudio: ${outputAudio}`);
        }
        
        resolve(outputAudio);
      }
    );
  });
};

const processGifToMp4 = async (gifPath: string, companyId: string): Promise<string> => {
  const outputVideo = `${publicFolder}/company${companyId}/${new Date().getTime()}.mp4`;
  
  return new Promise((resolve, reject) => {
    // Verificar se o arquivo GIF existe
    if (!fs.existsSync(gifPath)) {
      reject(new Error(`Arquivo GIF não encontrado: ${gifPath}`));
      return;
    }
    
    // Verificar se o FFmpeg está disponível
    if (!ffmpegPath) {
      reject(new Error("FFmpeg não está disponível. Instale o ffmpeg-static."));
      return;
    }
    
    const ffmpegCommand = ffmpeg(gifPath)
      .outputOptions([
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-an',
        '-shortest',
        '-y'
      ])
      .output(outputVideo)
      .on('end', () => {
        if (!fs.existsSync(outputVideo)) {
          reject(new Error(`Arquivo MP4 não foi criado: ${outputVideo}`));
          return;
        }
        
        const stats = fs.statSync(outputVideo);
        if (stats.size === 0) {
          reject(new Error(`Arquivo MP4 está vazio: ${outputVideo}`));
          return;
        }
        
        // CORRIGIR PERMISSÕES DO ARQUIVO MP4 CONVERTIDO
        try {
          fs.chmodSync(outputVideo, 0o777);
        } catch (err) {
          console.log(`Aviso: Não foi possível alterar permissões do arquivo MP4: ${outputVideo}`);
        }
        
        resolve(outputVideo);
      })
      .on('error', (err) => {
        reject(err);
      });
    
    // Executar a conversão
    ffmpegCommand.run();
  });
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  companyId?: string,
  body: string = " "
): Promise<any> => {
  const mimeType = mime.lookup(pathMedia);
  const typeMessage = mimeType.split("/")[0];

  try {
    if (!mimeType) {
      throw new Error("Invalid mimetype");
    }
    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName
      };
    } else if (typeMessage === "audio") {
      const typeAudio = true;
      const convert = await processAudio(pathMedia, companyId);
      if (typeAudio) {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
        };
      } else {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: typeAudio ? "audio/mp4" : mimeType,
          ptt: true
        };
      }
    } else if (typeMessage === "document" || fileName.endsWith('.psd')) {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: body ? body : null,
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body,
  isForwarded = false,
  forceMediaType,
  skipSave = false
}: Request): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);
    const companyId = ticket.companyId.toString();

    const pathMedia = media.path;
    const mimeType = media.mimetype;
    let typeMessage = mimeType.split("/")[0];
    const fileName = media.originalname.replace('/', '-');
    let options: AnyMessageContent;
    const bodyMessage = formatBody(body, ticket.contact);

    let savedFileName: string;
    let savedFilePath: string;
    let fileToSend: string;

    if (skipSave) {
      savedFilePath = pathMedia;
      fileToSend = pathMedia;
      savedFileName = fileName;
    } else {
      const isSticker = forceMediaType === "sticker";
      const baseFolder = `${publicFolder}/company${companyId}`;
      const folder = isSticker ? `${baseFolder}/stickers` : baseFolder;
      
      // Criar pasta e garantir permissões corretas
      ensureFolderPermissions(folder);
      
      const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith('.pdf');
      
      if (isPdf) {
        const existingFilePath = `${folder}/${fileName}`;
        if (fs.existsSync(existingFilePath)) {
          savedFileName = fileName;
          savedFilePath = existingFilePath;
          fs.unlinkSync(existingFilePath);
        } else {
          savedFileName = fileName;
          savedFilePath = existingFilePath;
        }
      } else {
        const timestamp = new Date().getTime();
        savedFileName = `${timestamp}_${fileName}`;
        savedFilePath = `${folder}/${savedFileName}`;
      }
      
      // Copiar arquivo
      fs.copyFileSync(pathMedia, savedFilePath);
      
      // CORRIGIR PERMISSÕES DO ARQUIVO COPIADO
      ensureFilePermissions(savedFilePath);
      
      fileToSend = savedFilePath;
    }

    if (forceMediaType === "sticker") {
      if (!fs.existsSync(fileToSend)) {
        throw new Error(`Arquivo de sticker não encontrado: ${fileToSend}`);
      }
      
      const stats = fs.statSync(fileToSend);
      if (stats.size === 0) {
        throw new Error(`Arquivo de sticker está vazio: ${fileToSend}`);
      }
      
      options = {
        sticker: fs.readFileSync(fileToSend),
        mimetype: mimeType || "image/webp"
      };
    } else if (forceMediaType === "gif" || mimeType === "image/gif" || fileName.toLowerCase().endsWith('.gif')) {
      // GIFs devem ser enviados como vídeo com gifPlayback: true (como no WhatsApp)
      // Se o arquivo for .gif, converter para MP4 primeiro
      let videoFileToSend = fileToSend;
      let finalMimetype = "image/gif";
      let isConverted = false;
      
      if (fileName.toLowerCase().endsWith('.gif') || mimeType === "image/gif") {
        try {
          if (!fs.existsSync(fileToSend)) {
            throw new Error(`Arquivo GIF não encontrado: ${fileToSend}`);
          }
          
          videoFileToSend = await processGifToMp4(fileToSend, companyId);
          
          if (!fs.existsSync(videoFileToSend)) {
            throw new Error(`Arquivo MP4 convertido não encontrado: ${videoFileToSend}`);
          }
          
          const stats = fs.statSync(videoFileToSend);
          if (stats.size === 0) {
            throw new Error(`Arquivo MP4 convertido está vazio: ${videoFileToSend}`);
          }
          
          finalMimetype = "video/mp4";
          isConverted = true;
        } catch (err) {
          videoFileToSend = fileToSend;
          finalMimetype = "image/gif";
        }
      } else {
        finalMimetype = "video/mp4";
      }
      
      if (!fs.existsSync(videoFileToSend)) {
        throw new Error(`Arquivo para envio não encontrado: ${videoFileToSend}`);
      }
      
      const videoBuffer = fs.readFileSync(videoFileToSend);
      if (videoBuffer.length === 0) {
        throw new Error(`Arquivo para envio está vazio: ${videoFileToSend}`);
      }
      
      options = {
        video: videoBuffer,
        caption: bodyMessage || null,
        gifPlayback: true,
        mimetype: finalMimetype
      };
      
      if (isConverted && videoFileToSend !== fileToSend) {
        (options as any)._tempFile = videoFileToSend;
      }
    } 
    else if (forceMediaType === "document") {
      // Se forceMediaType for "document", forçar como documento independente do tipo de arquivo
      options = {
        document: fs.readFileSync(fileToSend),
        caption: bodyMessage || null,
        fileName: fileName,
        mimetype: mimeType
      };
    } 
    else {
      // Lista de tipos MIME de vídeo comuns
      const videoMimeTypes = [
        'video/mp4',
        'video/3gpp',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/x-matroska',
        'video/webm',
        'video/ogg'
      ];

      // Lista de extensões que devem ser tratadas como documento
      const documentExtensions = ['.psd', '.ai', '.eps', '.indd', '.xd', '.sketch'];

      // Verifica se é um arquivo PSD ou similar (deve ser tratado como documento)
      const shouldBeDocument = documentExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

      if (shouldBeDocument) {
        options = {
          document: fs.readFileSync(fileToSend),
          caption: bodyMessage || null,
          fileName: fileName,
          mimetype: mimeType
        };
      }
      // Verifica se é um vídeo (incluindo vários formatos)
      // NOTA: GIFs já foram tratados acima, então não precisamos verificar novamente
      else if (typeMessage === "video" || videoMimeTypes.includes(mimeType)) {
        options = {
          video: fs.readFileSync(fileToSend),
          caption: bodyMessage || null,
          fileName: fileName,
          mimetype: mimeType
        };
      } else if (typeMessage === "audio") {
        // Verifica se o arquivo já é OGG
        if (mimeType === "audio/ogg") {
          options = {
            audio: fs.readFileSync(fileToSend),
            mimetype: "audio/ogg; codecs=opus",
            ptt: true
          };
        } else {
          // Converte para OGG se não for
          const convert = await processAudio(pathMedia, companyId);
          options = {
            audio: fs.readFileSync(convert),
            mimetype: "audio/ogg; codecs=opus",
            ptt: true
          };
        }
      } else if (typeMessage === "document" || mimeType === "application/pdf") {
        options = {
          document: fs.readFileSync(fileToSend),
          caption: bodyMessage || null,
          fileName: fileName,
          mimetype: mimeType
        };
      } else if (typeMessage === "image") {
        options = {
          image: fs.readFileSync(fileToSend),
          caption: bodyMessage || null
        };
      } else {
        // Caso o tipo de mídia não seja reconhecido, trata como documento
        options = {
          document: fs.readFileSync(fileToSend),
          caption: bodyMessage || null,
          fileName: fileName,
          mimetype: mimeType
        };
      }
    }

    const content = {
      ...(options as AnyMessageContent),
      contextInfo: {
        forwardingScore: isForwarded ? 2 : 0,
        isForwarded: isForwarded ? true : false
      }
    } as AnyMessageContent;

    let sentMessage: WAMessage;
    try {
      sentMessage = await wbot.sendMessage(
        buildContactAddress(ticket.contact, ticket.isGroup),
        content
      );
    } catch (sendError) {
      throw sendError;
    }

    await ticket.update({ lastMessage: bodyMessage || "📎 Mídia" });

    if (sentMessage) {
      let finalMediaUrl = savedFileName;
      
      if (forceMediaType === "sticker") {
        if (skipSave && savedFilePath) {
          const pathParts = savedFilePath.split(`company${companyId}`);
          if (pathParts.length > 1) {
            finalMediaUrl = pathParts[1].replace(/\\/g, '/').replace(/^\//, '');
          }
        } else if (!finalMediaUrl.startsWith('stickers/')) {
          finalMediaUrl = `stickers/${savedFileName}`;
        }
      }
      
      (sentMessage as any).mediaUrl = finalMediaUrl;
      (sentMessage as any).mediaPath = savedFilePath;
      
      const isGif = forceMediaType === "gif" || 
                    mimeType === "image/gif" || 
                    fileName.toLowerCase().endsWith('.gif') ||
                    savedFileName.toLowerCase().endsWith('.gif');
      
      if (isGif) {
        (sentMessage as any).forceMediaType = "gif";
      } else if (forceMediaType === "sticker") {
        (sentMessage as any).forceMediaType = "sticker";
      }
    }

    await verifyMessage(sentMessage, ticket, ticket.contact);

    if ((options as any)._tempFile && fs.existsSync((options as any)._tempFile)) {
      try {
        fs.unlinkSync((options as any)._tempFile);
      } catch (err) {
      }
    }
    /*
    if (forceMediaType === "sticker" && savedFilePath) {
      try {
        const { isAnimatedWebP } = await import("../../utils/webpDetector");
        
        const stickersSalvosFolder = path.resolve(publicFolder, `company${ticket.companyId}`, "stickers", "salvos");
        if (!fs.existsSync(stickersSalvosFolder)) {
          fs.mkdirSync(stickersSalvosFolder, { recursive: true });
          fs.chmodSync(stickersSalvosFolder, 0o777);
        }

        const stickerFileName = path.basename(savedFilePath);
        const isAnimated = await isAnimatedWebP(savedFilePath);
        
        const ext = path.extname(stickerFileName).toLowerCase();
        let finalStickerFileName = stickerFileName;
        let finalStickerDestination = path.join(stickersSalvosFolder, stickerFileName);
        
        if (isAnimated && ext !== ".webp") {
          const nameWithoutExt = path.basename(stickerFileName, ext);
          finalStickerFileName = `${nameWithoutExt}.webp`;
          finalStickerDestination = path.join(stickersSalvosFolder, finalStickerFileName);
        }
        
        if (!fs.existsSync(finalStickerDestination)) {
          fs.copyFileSync(savedFilePath, finalStickerDestination);
          console.log(`Sticker copiado para galeria: ${finalStickerFileName}`);
        }

        const stickerPath = `stickers/salvos/${finalStickerFileName}`;

        const existingSticker = await Sticker.findOne({
          where: {
            companyId: ticket.companyId,
            path: stickerPath
          }
        });

        if (!existingSticker) {
          await Sticker.create({
            companyId: ticket.companyId,
            name: finalStickerFileName,
            path: stickerPath,
            mimetype: isAnimated ? "image/webp" : (mimeType || mime.lookup(finalStickerDestination) || "image/webp"),
            userId: null
          });
          console.log(`Sticker salvo no banco: ${stickerPath}`);
        } else if (isAnimated && existingSticker.mimetype !== "image/webp") {
          await existingSticker.update({ mimetype: "image/webp" });
          console.log(`Sticker atualizado para WebP animado: ${stickerPath}`);
        }
      } catch (err) {
        Sentry.captureException(err);
      }
    }
    */

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;