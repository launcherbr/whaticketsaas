import Baileys from "../../models/Baileys";
import { cacheLayer } from "../../libs/cache";

const DeleteBaileysService = async (id: string | number): Promise<void> => {
  const baileysData = await Baileys.findOne({
    where: {
      whatsappId: id
    }
  });

  if (baileysData) {
    await baileysData.destroy();
  }

  await cacheLayer.delFromPattern(`sessions:${id}:*`);
};

export default DeleteBaileysService;
