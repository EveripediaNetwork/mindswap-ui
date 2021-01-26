import { getUserTokens, getRefreshTokens } from "../../utils/ApiDataProvider";

export const updateTokenBalance = async (user, dispatch) => {
  const accountName = await user.getAccountName();
  const userTokens = await getUserTokens(accountName);
  if (userTokens.length > 0) {
    dispatch({
      type: "UPDATE_TOKEN_BALANCE",
      payload: userTokens,
    });
  }
};

export const refreshTokenBalance = async (user, query, dispatch) => {
  const accountName = await user.getAccountName();
  const refreshedTokens = await getRefreshTokens(
    accountName,
    query.slice(0, -1)
  );
  if (refreshedTokens.length > 0) {
    dispatch({
      type: "UPDATE_TOKEN_BALANCE",
      payload: refreshedTokens,
    });
  }
};
