import React, { createContext, useReducer, useContext } from "react";
import PropTypes from "prop-types";
import userPoolReducer from "./userPoolReducer";

const UserPoolStateContext = createContext(undefined);
const UserPoolDispatchContext = createContext(undefined);

const UserPoolProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userPoolReducer, {
    userPool: [],
  });
  return (
    <UserPoolStateContext.Provider value={state}>
      <UserPoolDispatchContext.Provider value={dispatch}>
        {children}
      </UserPoolDispatchContext.Provider>
    </UserPoolStateContext.Provider>
  );
};

UserPoolProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const useUserPoolState = () => {
  const context = useContext(UserPoolStateContext);
  if (context === undefined) {
    throw new Error("useUserPoolState must be used within a UserPoolProvider");
  }
  return context;
};

const useUserPoolDispatch = () => {
  const context = useContext(UserPoolDispatchContext);
  if (context === undefined) {
    throw new Error("useUserPoolDispatch must be used within a UserPoolProvider");
  }
  return context;
};

export { UserPoolProvider, useUserPoolState, useUserPoolDispatch };
