import { getUserShares } from "../../utils/PrediqtDataProvider";

export const updateSharesBalance = async (user, tokens, dispatch) => {
  try {
    const accountName = await user.getAccountName();
    const result = await getUserShares(accountName);
    const filteredSharesWithTokens = result
      .filter((s) => s.status === "ACTIVE")
      .map((share) => {
        const shareSide = share.symbol === "YES" ? 1 : 0;
        const found = tokens.find(
          (token) =>
            token.marketId === share.market.id && token.side === shareSide
        );
        return {
          ...share,
          token: found,
        };
      })
      .filter((share) => {
        return share.token;
      });

    dispatch({
      type: "SET_SHARES",
      payload: filteredSharesWithTokens,
    });
  } catch (ex) {
    console.error(ex);
  }
};
