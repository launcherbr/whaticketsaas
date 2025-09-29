import { QueryTypes } from "sequelize";
import sequelize from "../../database";

type Result = {
  id: number;
  currentSchedule: [];
  startTimeA: string;
  endTimeA: string;
  startTimeB: string | null;
  endTimeB: string | null;
  inActivity: boolean;
};

const VerifyCurrentSchedule = async (id: string | number): Promise<Result> => {
  const sql = `
    select
      s.id,
      s.currentWeekday,
      s.currentSchedule,
      (s.currentSchedule->>'startTimeA')::time "startTimeA",
      (s.currentSchedule->>'endTimeA')::time "endTimeA",
      coalesce(nullif((s.currentSchedule->>'startTimeB'), ''), '00:00')::time "startTimeB",
      coalesce(nullif((s.currentSchedule->>'endTimeB'), ''), '00:00')::time "endTimeB",
      (
        now()::time >= (s.currentSchedule->>'startTimeA')::time and
        now()::time <= (s.currentSchedule->>'endTimeA')::time or
        now()::time >= coalesce(nullif((s.currentSchedule->>'startTimeB'), ''), '00:00')::time and
        now()::time <= coalesce(nullif((s.currentSchedule->>'endTimeB'), ''), '00:00')::time
      ) "inActivity"
    from (
      SELECT
            c.id,
            to_char(current_date, 'day') currentWeekday,
            (array_to_json(array_agg(s))->>0)::jsonb currentSchedule
      FROM "Companies" c, jsonb_array_elements(c.schedules) s
      WHERE s->>'weekdayEn' like trim(to_char(current_date, 'day')) and c.id = :id
      GROUP BY 1, 2
    ) s
    where s.currentSchedule->>'startTimeA' not like '' and
      s.currentSchedule->>'endTimeA' not like '' or
      coalesce(nullif(s.currentSchedule->>'startTimeB', ''), '00:00') not like '' and
      coalesce(nullif(s.currentSchedule->>'endTimeB', ''), '00:00') not like '';
  `;

  const result: Result = await sequelize.query(sql, {
    replacements: { id },
    type: QueryTypes.SELECT,
    plain: true
  });

  return result;
};

export default VerifyCurrentSchedule;
