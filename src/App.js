import React, { lazy, Suspense, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Error from "./features/error";
import Loading from "./features/loading";
import ErrorBoundary from "./components/errorBoundary";
import { TokensProvider } from "./context/tokensProvider/tokensContext";
import { UserTokensProvider } from "./context/userTokensProvider/userTokensContext";
import { UserPoolProvider } from "./context/userPoolProvider/userPoolContext";
import { PoolsProvider } from "./context/poolsProvider/poolsContext";
import { UserSharesProvider } from "./context/userSharesProvider/userSharesContext";
import useGoogleAnalytics from "./hooks/useGoogleAnalytics";
import {
  UALProviderSwitch,
  WalletProvider,
} from "./context/walletProvider/walletProviderFacade";
import { defaultSlippage } from "./constants/index";
import SlippageContext from "./context/settingsProvider/InitialSettingsContext";

const HomePage = lazy(() => import("./features/home"));
const PoolPage = lazy(() => import("./features/pool"));
const ConvertPage = lazy(() => import("./features/convert"));

function App() {
  const InitialSlippage = localStorage.getItem("slippageTolerance")
    ? localStorage.getItem("slippageTolerance")
    : defaultSlippage;
  const [slippageLimit, setSlippageLimit] = useState(InitialSlippage);
  const SlippageLimiter = { slippageLimit, setSlippageLimit };

  return (
    <ErrorBoundary fallback={<Error />}>
      <Suspense fallback={<Loading />}>
        <UALProviderSwitch>
          <WalletProvider>
            <TokensProvider>
              <UserTokensProvider>
                <UserPoolProvider>
                  <PoolsProvider>
                    <SlippageContext.Provider value={SlippageLimiter}>
                      <UserSharesProvider>
                        <Router>
                          <Routes />
                        </Router>
                      </UserSharesProvider>
                    </SlippageContext.Provider>
                  </PoolsProvider>
                </UserPoolProvider>
              </UserTokensProvider>
            </TokensProvider>
          </WalletProvider>
        </UALProviderSwitch>
      </Suspense>
    </ErrorBoundary>
  );
}

function Routes() {
  useGoogleAnalytics();
  return (
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route exact path="/pool" component={PoolPage} />
      <Route exact path="/convert" component={ConvertPage} />
    </Switch>
  );
}

export default App;
