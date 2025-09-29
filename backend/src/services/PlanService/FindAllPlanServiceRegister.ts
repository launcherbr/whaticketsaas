import Plan from "../../models/Plan";

const FindAllPlanServiceRegister = async (): Promise<Plan[]> => {
  const plans = await Plan.findAll({
    where: {
      useInternal: true
    },
    order: [["name", "ASC"]]
  });
  return plans;
};

export default FindAllPlanServiceRegister;
