import { getUserPools } from "../../utils/ApiDataProvider";

export const updateUserPool = async (user, dispatch) => {
  const accountName = await user.getAccountName();
  const userPoolInfo = await getUserPools(accountName);
  if (userPoolInfo) {
    dispatch({
      type: "UPDATE_USERPOOL",
      payload: userPoolInfo,
    });
  }
};