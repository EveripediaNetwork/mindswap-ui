import React, { createContext, useReducer, useContext } from "react";
import PropTypes from "prop-types";
import poolsReducer from "./poolsReducer";
import initialPoolContext from "./initialPoolContext";

const PoolsStateContext = createContext(undefined);
const PoolsDispatchContext = createContext(undefined);

const PoolsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(poolsReducer, {
    pools: initialPoolContext,
  });

  return (
    <PoolsStateContext.Provider value={state}>
      <PoolsDispatchContext.Provider value={dispatch}>
        {children}
      </PoolsDispatchContext.Provider>
    </PoolsStateContext.Provider>
  );
};

PoolsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const usePoolsState = () => {
  const context = useContext(PoolsStateContext);
  if (context === undefined) {
    throw new Error("usePoolsState must be used within a PoolsProvider");
  }
  return context;
};

const usePoolsDispatch = () => {
  const context = useContext(PoolsDispatchContext);
  if (context === undefined) {
    throw new Error("usePoolsDispatch must be used within a PoolsProvider");
  }
  return context;
};

export { PoolsProvider, usePoolsState, usePoolsDispatch };
