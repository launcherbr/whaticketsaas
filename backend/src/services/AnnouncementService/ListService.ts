import { Op, fn, col, where } from "sequelize";
import { isEmpty } from "lodash";
import Announcement from "../../models/Announcement";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId?: number;
  isSuperAdmin?: boolean;
  includeHiddenForSuperAdmin?: boolean;
}

interface Response {
  records: Announcement[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  isSuperAdmin = false,
  includeHiddenForSuperAdmin = false
}: Request): Promise<Response> => {
  let whereCondition: any = {
    status: true
  };

  // Filtrar por empresa
  if (companyId) {
    whereCondition.companyId = companyId;
  }

  // Se for superadmin, filtrar por showForSuperAdmin
  if (isSuperAdmin && !includeHiddenForSuperAdmin) {
    whereCondition.showForSuperAdmin = true;
  }

  if (!isEmpty(searchParam)) {
    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          title: where(
            fn("LOWER", col("Announcement.title")),
            "LIKE",
            `%${searchParam.toLowerCase().trim()}%`
          )
        }
      ]
    };
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: records } = await Announcement.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + records.length;

  return {
    records,
    count,
    hasMore
  };
};

export default ListService;
