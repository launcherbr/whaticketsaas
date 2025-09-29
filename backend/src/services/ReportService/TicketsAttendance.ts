import sequelize from "../../database/index";
import { QueryTypes } from "sequelize";

interface Return {
  data: {};
}

interface Request {
  initialDate: string;
  finalDate: string;
  companyId: number;
}

interface DataReturn {
  quantidade: number;
  data?: number;
  nome?: string;
}

interface dataUser {
  name: string;
}

export const TicketsAttendance = async ({ initialDate, finalDate, companyId }: Request): Promise<Return> => {

  const sqlUsers = `select u.name from "Users" u where u."companyId" = ${companyId}`

  const users: dataUser[] = await sequelize.query(sqlUsers, { type: QueryTypes.SELECT });

  const sql = `
  select
    COUNT(*) AS quantidade,
    u.name AS nome
  from
    "TicketTraking" tt
    left join "Users" u on u.id = tt."userId"
  where
    tt."companyId" = ${companyId}
    and "ticketId" is not null
    and tt."userId" is not null
    and tt."finishedAt" >= '${initialDate} 00:00:00'
    and tt."finishedAt" <= '${finalDate} 23:59:59'
  group by
    nome
  ORDER BY
    nome asc`

  const data: DataReturn[] = await sequelize.query(sql, { type: QueryTypes.SELECT });

  users.map(user => {
    let indexCreated = data.findIndex((item) => item.nome === user.name);

    if (indexCreated === -1) {
      data.push({ quantidade: 0, nome: user.name })
    }

  })

  return { data };
}
