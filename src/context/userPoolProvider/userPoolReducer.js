const userPoolReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_USERPOOL": {
      return {
        userPool: action.payload,
      };
    }
    default:
      throw new Error("unexpected UserPoolReducer case");
  }
};

export default userPoolReducer;
