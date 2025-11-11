import { hash } from "bcryptjs";
import { Op } from "sequelize";
import User from "../../models/User";

const ResetPassword = async (
  email: string,
  token: string,
  password: string
) => {
  const user = await User.findOne({
    where: {
      email,
      resetPassword: {
        [Op.ne]: ""
      }
    }
  });

  if (!user) {
    return { status: 404, message: "Email não encontrado" };
  }

  if (user.resetPassword !== token) {
    return { status: 404, message: "Token não encontrado" };
  }

  const hashedPassword = await hash(password, 8);

  await user.update({
    passwordHash: hashedPassword,
    resetPassword: ""
  });

  return { status: 200, message: "Senha atualizada com sucesso" };
};

export default ResetPassword;
