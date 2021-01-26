import React, { useContext, useState, useEffect } from "react";
import { UALContext, UALProvider } from "ual-reactjs-renderer";
import {
  appName,
  supportedAuthenticators,
  supportedChains,
} from "../../utils/UalProvider";
import { prediqtUrl } from "../../config";

/**
 * Checked if you are in an IFrame
 * @returns {boolean}
 */
export function inIframe() {
  try {
    return (
      window.self !== window.top &&
      window.location.search.match("wallet=parent")
    );
  } catch (e) {
    return true;
  }
}

export const WallerProviderContext = React.createContext(null);

/**
 * handle calling the parent iframe and the result callback
 * @param parentWindowUrl
 * @param eventName
 * @returns {Promise<unknown>}
 */
const handleCallback = (parentWindowUrl, eventName) => {
  return new Promise((resolve, reject) => {
    const listener = (event) => {
      // check the origin of the requests!
      if (event.origin.startsWith(parentWindowUrl)) {
        const { event: evt, data, error } = event.data;
        if (evt === eventName) {
          window.removeEventListener("message", listener);
          if (data) {
            resolve(JSON.parse(data));
          } else {
            reject(JSON.parse(error));
          }
        }
      }
    };
    window.addEventListener("message", listener);
    // timeout if PredIQt does not respond in 30secs
    setTimeout(() => {
      window.removeEventListener("message", listener);
      reject(new Error("PredIQt did not response in time"));
    }, 30000);
  });
};

/**
 * call parent window for wallet methods
 * @param eventName
 * @param params
 * @param parentWindowUrl
 * @returns {Promise<unknown>}
 */
const makeRpcToParent = (eventName, params, parentWindowUrl) => {
  window.parent.postMessage(
    { event: eventName, data: JSON.stringify(params) },
    "*"
  );
  return handleCallback(parentWindowUrl, eventName);
};

/**
 * logged in user state and methods
 * @param userName
 * @param parentWindowUrl
 * @returns {{logout: (function(): null), activeUser: {getAccountName: (function(): *), rpc: {get_table_rows: (function(...[*]=): Promise<unknown>), get_currency_balance: (function(...[*]=): Promise<unknown>)}, accountName: *, signTransaction: (function(...[*]=): Promise<unknown>)}, showModal: (function(): null)}}
 */
const loggedInStateIframe = (userName, parentWindowUrl) => ({
  activeUser: {
    getAccountName: () => userName,
    accountName: userName,
    rpc: {
      get_currency_balance: (...params) =>
        makeRpcToParent("get_currency_balance", params, parentWindowUrl),
      get_table_rows: (...params) =>
        makeRpcToParent("get_table_rows", params, parentWindowUrl),
    },
    signTransaction: (...params) =>
      makeRpcToParent("signTransaction", params, parentWindowUrl),
  },
  showModal: () => null, // do nothing
  logout: () => null, // do nothing
});

/**
 * default state for logged out iframe
 * @type {{logout: (function(): null), activeUser: null, showModal: (function(): null)}}
 */
const loggedOutStateIframe = {
  activeUser: null,
  showModal: () => null, // do nothing
  logout: () => null, // do nothing
};

/**
 * WalletProvider Proxies the local wallet provider or the parent's
 * @param children
 * @returns {*}
 * @constructor
 */
export const WalletProvider = ({ children }) => {
  const parentWindowUrl = prediqtUrl;

  let authContext = useContext(UALContext);
  const isInIframe = inIframe();
  if (isInIframe) {
    authContext = loggedOutStateIframe;
  }

  const [walletState, setWalletState] = useState({
    // eslint-disable-next-line react/no-unused-state
    activeUser: authContext.activeUser,
    // eslint-disable-next-line react/no-unused-state
    showModal: () => {
      authContext.showModal();
    },
    // eslint-disable-next-line react/no-unused-state
    logout: () => authContext.logout(),
    tweaker: 0,
  });

  useEffect(() => {
    if (isInIframe) {
      window.addEventListener("message", (event) => {
        // check the origin of the requests!
        if (event.origin.startsWith(parentWindowUrl)) {
          // The data was sent from a legit site.
          // Data sent with postMessage is stored in event.data:
          const { event: evt, data } = event.data;
          switch (evt) {
            case "LOGIN":
              setWalletState(loggedInStateIframe(data, parentWindowUrl));
              break;
            case "LOGOUT":
              setWalletState(loggedOutStateIframe);
              break;
            default:
              break;
          }
        } else {
          // The data was NOT sent from your site!
          // SECURITY ISSUE, DO NOT DO ANYTHING!!!
        }
      });
      window.parent.postMessage({ event: "READY", data: "MindSwap" }, "*");
    }
  }, []);

  /**
   * when user is logged in/out update the provider's state
   */
  useEffect(() => {
    if (!isInIframe) {
      setWalletState({
        ...walletState,
        activeUser: authContext.activeUser,
        tweaker: walletState.tweaker + 1,
      });
    }
  }, [authContext.activeUser]);

  return (
    <WallerProviderContext.Provider value={walletState}>
      {children}
    </WallerProviderContext.Provider>
  );
};

/**
 * if in an iframe then use parent wallet provider otherwise use local
 * @param children
 * @returns {*}
 * @constructor
 */
export const UALProviderSwitch = ({ children }) => {
  const isInIframe = inIframe();
  return (
    <>
      {isInIframe ? (
        <>{children}</>
      ) : (
        <UALProvider
          chains={supportedChains}
          authenticators={supportedAuthenticators}
          appName={appName}
        >
          {children}
        </UALProvider>
      )}
    </>
  );
};
