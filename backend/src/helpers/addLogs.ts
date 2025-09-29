import * as fsp from 'fs/promises';
import path from "path";
import * as fs from "fs";
// const filePath = 'caminho/do/seu/arquivo.txt';

export async function addLogs({fileName, text, forceNewFile=false}) {
        const logs = path.resolve(__dirname, "..","..", "logs");  
        const filePath  = path.resolve(logs,fileName)


    try {

        console.log(logs)
        if (!fs.existsSync(logs)) {
          fs.mkdirSync(logs);
        }
    } catch (error) {

    }

  try {
    if(forceNewFile){
      await fsp.writeFile(filePath,  `${text} \n`);
      console.log(`Novo Arquivo de log adicionado ${filePath}\n \n ${text}`);

    }else

    await fsp.appendFile(filePath, `${text} \n` );
    console.log(`Texto adicionado ao arquivo de log ${filePath}\n \n ${text}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // O arquivo não existe, então cria e adiciona o texto
      await fsp.writeFile(filePath,  `${text} \n`);
      console.log(`Novo Arquivo de log adicionado ${filePath}\n \n ${text}`);
    } else {
      console.error('Erro ao manipular o arquivo de log:', err);
    }
  }
}