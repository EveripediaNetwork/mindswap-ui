const poolsReducer = (state, action) => {
  switch (action.type) {
    case "SET_POOL": {
      return {
        pools: [action.payload],
      };
    }

    case "CLEAN_SELECTED_POOL": {
      return {
        pools: [],
      };
    }

    default:
      throw new Error("unexpected poolsReducer case");
  }
};

export default poolsReducer;
