import { Request, Response } from "express";
import Sticker from "../models/Sticker";
import path from "path";
import fs from "fs";
import { Op } from "sequelize";
import { isAnimatedWebP } from "../utils/webpDetector";
import { ensureFolderPermissions } from "../helpers/EnsurePermissions";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;

  // Buscar stickers da empresa (userId null) e stickers do usuário atual
  const stickers = await Sticker.findAll({
    where: {
      companyId,
      [Op.or]: [
        { userId: null }, // Stickers compartilhados da empresa
        { userId } // Stickers do usuário
      ]
    },
    order: [["createdAt", "DESC"]]
  });

  return res.json(stickers);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const file = req.file;
  const { isShared } = req.body;

  if (!file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  try {
    const folder = path.resolve(__dirname, "..", "..", "public", `company${companyId}`, "stickers", "salvos");
    
    // Criar pasta e garantir permissões corretas
    ensureFolderPermissions(folder);

    if (!file.path || !fs.existsSync(file.path)) {
      console.error("Arquivo não encontrado no caminho:", file.path);
      return res.status(500).json({ error: "Erro ao salvar arquivo" });
    }

    // Obter extensão do arquivo
    const ext = path.extname(file.originalname).toLowerCase() || '.webp';
    
    // Determinar mimetype
    let mimetype = file.mimetype;
    if (!mimetype || (ext === ".gif" && !mimetype.includes("gif")) || 
                     (ext === ".webp" && !mimetype.includes("webp")) ||
                     (ext === ".png" && !mimetype.includes("png"))) {
      if (ext === ".gif") {
        mimetype = "image/gif";
      } else if (ext === ".webp") {
        mimetype = "image/webp";
      } else if (ext === ".png") {
        mimetype = "image/png";
      } else if (ext === ".jpg" || ext === ".jpeg") {
        mimetype = "image/jpeg";
      } else {
        mimetype = "image/webp";
      }
    }
    
    // NOVO SISTEMA: Gerar ID sequencial (stickers01, stickers02, etc)
    // Buscar o último sticker da empresa para gerar o próximo ID
    const lastSticker = await Sticker.findOne({
      where: { companyId },
      order: [['id', 'DESC']]
    });
    
    // Gerar próximo número (com padding de 2 dígitos)
    const nextNumber = lastSticker ? lastSticker.id + 1 : 1;
    const paddedNumber = String(nextNumber).padStart(2, '0');
    const newFileName = `stickers${paddedNumber}${ext}`;
    
    // Mover arquivo do multer para o nome final
    const oldPath = file.path;
    const newPath = path.join(folder, newFileName);
    
    // Se arquivo já existe, encontrar próximo disponível
    let finalFileName = newFileName;
    let finalPath = newPath;
    let counter = nextNumber;
    
    while (fs.existsSync(finalPath)) {
      counter++;
      const paddedCounter = String(counter).padStart(2, '0');
      finalFileName = `stickers${paddedCounter}${ext}`;
      finalPath = path.join(folder, finalFileName);
    }
    
    // Renomear/mover arquivo
    fs.renameSync(oldPath, finalPath);
    fs.chmodSync(finalPath, 0o777);
    
    const relativePath = `stickers/salvos/${finalFileName}`;
    
    const sticker = await Sticker.create({
      companyId,
      userId: isShared === "true" || isShared === true ? null : userId,
      name: file.originalname,
      path: relativePath,
      mimetype
    });
    
    return res.json(sticker);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { stickerId } = req.params;
  const { companyId, id: userId } = req.user;

  try {
    const sticker = await Sticker.findOne({
      where: { 
        id: stickerId, 
        companyId,
        [Op.or]: [
          { userId: null }, // Stickers compartilhados podem ser removidos por qualquer usuário
          { userId } // Stickers do usuário só podem ser removidos pelo dono
        ]
      }
    });

    if (!sticker) {
      return res.status(404).json({ error: "Sticker não encontrado" });
    }

    // Remover arquivo
    const publicFolder = path.resolve(__dirname, "..", "..", "public");
    
    // Path no banco sempre é: stickers/salvos/nome.ext
    // Arquivo físico está em: companyId/stickers/salvos/nome.ext
    // Construir caminho correto: companyId/stickers/salvos/nome.ext
    let filePath = path.join(publicFolder, `company${companyId}`, sticker.path);
    
    // Se não encontrar no local correto, tentar estruturas alternativas (compatibilidade)
    if (!fs.existsSync(filePath)) {
      // Tentar estrutura antiga (raiz da company)
      const altPath1 = path.join(publicFolder, `company${companyId}`, path.basename(sticker.path));
      if (fs.existsSync(altPath1)) {
        filePath = altPath1;
        console.log(`Sticker encontrado em localização antiga: ${altPath1}`);
      } else {
        // Tentar estrutura muito antiga
        const altPath2 = path.join(publicFolder, "stickers", `company${companyId}`, sticker.path);
        if (fs.existsSync(altPath2)) {
          filePath = altPath2;
          console.log(`Sticker encontrado em localização muito antiga: ${altPath2}`);
        } else {
          // Tentar em stickers/ (recebidos/enviados)
          const altPath3 = path.join(publicFolder, `company${companyId}`, "stickers", path.basename(sticker.path));
          if (fs.existsSync(altPath3)) {
            filePath = altPath3;
            console.log(`Sticker encontrado em stickers/: ${altPath3}`);
          }
        }
      }
    }
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Sticker removido: ${filePath}`);
      } catch (err) {
        console.error(`Erro ao remover arquivo: ${filePath}`, err);
        // Continuar mesmo se falhar a remoção do arquivo
      }
    } else {
      // Não é erro crítico se o arquivo não existir (pode ter sido removido manualmente)
      console.warn(`Arquivo não encontrado para remoção: ${filePath} (path: ${sticker.path})`);
    }

    await sticker.destroy();

    return res.json({ message: "Sticker removido com sucesso" });
  } catch (err: any) {
    console.error("Erro ao remover sticker:", err);
    return res.status(500).json({ error: err.message });
  }
};
