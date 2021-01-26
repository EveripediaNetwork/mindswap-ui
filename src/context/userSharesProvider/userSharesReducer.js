const userSharesReducer = (state, action) => {
  switch (action.type) {
    case "SET_SHARES": {
      return {
        userShares: [...action.payload],
      };
    }

    default:
      throw new Error("unexpected userSharesReducer case");
  }
};

export default userSharesReducer;
