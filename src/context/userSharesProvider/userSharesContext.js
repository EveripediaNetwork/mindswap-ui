import React, { createContext, useReducer, useContext } from "react";
import PropTypes from "prop-types";
import userSharesReducer from "./userSharesReducer";
import initialUserSharesContext from "./initialUserSharesContext";

const UserSharesStateContext = createContext(undefined);
const UserSharesDispatchContext = createContext(undefined);

const UserSharesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userSharesReducer, {
    userShares: initialUserSharesContext,
  });

  return (
    <UserSharesStateContext.Provider value={state}>
      <UserSharesDispatchContext.Provider value={dispatch}>
        {children}
      </UserSharesDispatchContext.Provider>
    </UserSharesStateContext.Provider>
  );
};

UserSharesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const useUserSharesState = () => {
  const context = useContext(UserSharesStateContext);
  if (context === undefined) {
    throw new Error(
      "useUserSharesState must be used within a UserSharesProvider"
    );
  }
  return context;
};

const useUserSharesDispatch = () => {
  const context = useContext(UserSharesDispatchContext);
  if (context === undefined) {
    throw new Error(
      "useUserSharesDispatch must be used within a UserSharesProvider"
    );
  }
  return context;
};

export { UserSharesProvider, useUserSharesState, useUserSharesDispatch };
