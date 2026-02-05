import fs from "fs";
import path from "path";

/**
 * Corrige as permissões de todas as pastas de company no diretório public
 * Garante que todas tenham permissão 777 para evitar erros de EACCES
 */
const fixCompanyFoldersPermissions = () => {
  const publicFolder = path.resolve(__dirname, "..", "..", "public");
  
  console.log("🔧 Iniciando correção de permissões...");
  console.log(`📁 Pasta public: ${publicFolder}`);
  
  try {
    // Garantir que a pasta public tenha permissão 777
    if (fs.existsSync(publicFolder)) {
      fs.chmodSync(publicFolder, 0o777);
      console.log("✅ Permissões da pasta public ajustadas");
    }
    
    // Ler todos os itens do diretório public
    const items = fs.readdirSync(publicFolder);
    
    let companiesFixed = 0;
    
    items.forEach(item => {
      const itemPath = path.join(publicFolder, item);
      const stats = fs.statSync(itemPath);
      
      // Processar apenas pastas que começam com "company"
      if (stats.isDirectory() && item.startsWith("company")) {
        console.log(`\n📂 Processando: ${item}`);
        
        // Corrigir permissões da pasta principal
        fs.chmodSync(itemPath, 0o777);
        console.log(`  ✅ Permissões ajustadas: ${item}/`);
        
        // Corrigir permissões de subpastas recursivamente
        fixPermissionsRecursively(itemPath, "  ");
        
        companiesFixed++;
      }
    });
    
    console.log(`\n🎉 Concluído! ${companiesFixed} pasta(s) de company processada(s)`);
    console.log("✨ Todas as permissões foram ajustadas para 777");
    
  } catch (error) {
    console.error("❌ Erro ao corrigir permissões:", error);
    throw error;
  }
};

/**
 * Função recursiva para corrigir permissões de subpastas e arquivos
 */
const fixPermissionsRecursively = (dirPath: string, indent: string = "") => {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      
      try {
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // Corrigir permissões da pasta
          fs.chmodSync(itemPath, 0o777);
          console.log(`${indent}  ✅ ${item}/`);
          
          // Processar recursivamente
          fixPermissionsRecursively(itemPath, indent + "  ");
        } else {
          // Corrigir permissões do arquivo
          fs.chmodSync(itemPath, 0o777);
        }
      } catch (err) {
        console.log(`${indent}  ⚠️  Não foi possível ajustar: ${item}`);
      }
    });
  } catch (error) {
    console.error(`${indent}  ❌ Erro ao ler diretório: ${dirPath}`, error);
  }
};

// Executar a função
fixCompanyFoldersPermissions();

export default fixCompanyFoldersPermissions;
