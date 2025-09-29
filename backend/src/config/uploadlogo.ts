import path from "path";
import multer from "multer";

const publicFolder = path.resolve(__dirname, "..", "..", "public/logotipos");

export default {
  directory: publicFolder,
  
  storage: multer.diskStorage({
    destination: publicFolder,
    filename(req, file, cb) {
    
 
      const desiredFileName = req.query.ref + path.extname(file.originalname);

      return cb(null, desiredFileName);
    }
  })
};
