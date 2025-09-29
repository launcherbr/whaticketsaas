import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";

interface Request {
  settingKey: string; // Add settingKey property
  companyId: number;
}

const ShowSettingsService = async ({
  settingKey, // Update parameter name to settingKey
  companyId
}: Request): Promise<Setting | undefined> => {
  const setting = await Setting.findOne({
    where: { key: settingKey, companyId } // Update key to settingKey
  });

  if (!setting) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  return setting;
};

export default ShowSettingsService;