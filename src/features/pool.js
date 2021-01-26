import React, {
  useCallback,
  useEffect,
  useState,
  useContext,
} from "react";
import { useForm, FormProvider } from "react-hook-form";
import styled from "styled-components";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { WallerProviderContext as UALContext } from "../context/walletProvider/walletProviderFacade";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Layout from "../components/layouts/layout";
import SwapContainer from "../components/ui/swapContainer";
import {
  useTokensDispatch,
  useTokensState,
} from "../context/tokensProvider/tokensContext";
import { useUserTokensDispatch } from "../context/userTokensProvider/userTokensContext";
import CardTitle from "../components/ui/cardTitle";
import InfoAlert from "../components/ui/infoAlert";
import PricePerToken from "../components/ui/pricePerToken";
import TokenListModal from "../components/ui/tokenListModal";
import TransactionModal, {
  TRANSACTION_STATUS,
} from "../components/ui/transactionModal";
import {
  usePoolsDispatch,
  usePoolsState,
} from "../context/poolsProvider/poolsContext";
import {
  addLiquidity,
  getAddLiquidityAssetsToken,
  getPairForSwap,
  getPoolInfo,
} from "../utils/EosDataProvider";
import { refreshTokenBalance } from "../context/userTokensProvider/userTokensActions";
import CardMarketTitle from "../components/ui/cardMarketTitle";
import Loading from "./loading";
import InfoPoolCard from "../components/ui/infoPoolCard";
import UserLiquidityCard from "../components/ui/userLiquidityCard";
import ManageRefreshStorage, {
  buildRefreshQuery,
} from "../utils/manageRefreshStorage";

const IconWrapper = styled(Button)`
  margin: 15px;
  color: rgb(86, 90, 105);
  text-align: center;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
  background: none;
`;

const DisabledSwapContainer = styled.div`
  pointer-events: none;
  opacity: 0.4;
`;

const MainCard = styled(Card)``;

const YourLiquidityCard = styled(Card)`
    max-width: 1600px;
    margin-top: 12px;
    padding: 1% !important;

    .card-body {
      padding: 0.35rem !important;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
    }
  .card-title {
    padding: 1%;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    .record {
      text-align: right;
      color: #924db3;
    }
`;

const InitialSwapContainer = ({ token, setToken, ...props }) => {
  const dispatch = useTokensDispatch();

  useEffect(() => {
    dispatch({ type: "SELECT_TOKEN", payload: token.name });
  }, [dispatch, token]);

  return <SwapContainer token={token} setToken={setToken} {...props} />;
};

InitialSwapContainer.propTypes = {
  token: PropTypes.any.isRequired,
  setToken: PropTypes.any.isRequired,
};

const initialTransactionStatus = {
  status: TRANSACTION_STATUS.LOADING,
  txid: null,
  error: null,
};

const PoolsPage = () => {
  const { t } = useTranslation();
  const poolDispatch = usePoolsDispatch();
  const tokenDispatch = useTokensDispatch();
  const userTokensDispatch = useUserTokensDispatch();
  const methods = useForm({ mode: "onChange" });
  const { tokens } = useTokensState();
  const { pools } = usePoolsState();
  const [toBuy, setToBuy] = useState();
  const [pairs, setPairs] = useState();
  const [loadingPairs, setLoadingPairs] = useState(false);
  const [tokenModalShow, setTokenModalShow] = useState(false);
  const [transactionModalShow, setTransactionModalShow] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(
    initialTransactionStatus
  );
  const [callBackSwap, setCallBackSwap] = useState(null);
  const [loading, isLoading] = useState(true);
  const authContext = useContext(UALContext);

  const [token1, setToken1] = React.useState();
  const [token2, setToken2] = React.useState();
  const [marketId, setMarketId] = React.useState();
  const [selectedTokens, setSelectedTokens] = React.useState();
  const [updateTokens, setUpdateTokens] = React.useState(true);
  const [refreshArray, setRefreshArray] = React.useState([]);
  const [refreshQuery, setRefreshQuery] = React.useState("");

  const refreshInStorage = new ManageRefreshStorage(
    refreshQuery,
    setRefreshQuery,
    setRefreshArray
  );

  useEffect(() => {
    if (!token1) {
      const defaultToken1 = tokens.find((token) => token.isDefault);
      setToken1(defaultToken1);
    }
    if (token2) {
      const defaultToken1 = tokens.find((token) => token.isDefault);
      const filteredTokens = tokens.filter((token) => token.isSelected);
      if (filteredTokens.length < 2) {
        setToken1(defaultToken1);
      }
    }
    if (tokens.length > 0) {
      setUpdateTokens(false);
    }
  }, [tokens, token1, token2]);

  useEffect(() => {
    let TokenList;
    if (!token1 && !token2) {
      TokenList = tokens.filter((token) => {
        return token.isDefault;
      });
    } else if ((token1 && !token2) || (token1 && token2)) {
      TokenList = tokens.filter((token) => {
        return token.isSelected;
      });
    } else if (!token1 && token2) {
      TokenList = tokens.filter((token) => {
        return token.isSelected || token.isDefault;
      });
    }
    setSelectedTokens(TokenList);
    if (TokenList.length === 2) {
      const MarketIdFound = TokenList.find((m) => m.marketId > 0)?.marketId;
      setMarketId(MarketIdFound);
    } else {
      setMarketId();
    }
  }, [token1, token2, tokens]);

  useEffect(() => {
    if (refreshArray.length > 1) {
      const queryString = buildRefreshQuery(refreshArray);
      setRefreshQuery(queryString);
    }
  }, [refreshArray]);

  useEffect(() => {
    if (refreshArray.length > 1) {
      const user = authContext.activeUser;
      refreshInStorage.setRefreshStorage();
      refreshTokenBalance(user, refreshQuery, userTokensDispatch);
    }
  }, [refreshQuery]);

  const updateAmountsOnSelectedToken = (pairs) => {
    const { FromAmount } = methods.getValues();

    const addLiquidityAssets = getAddLiquidityAssetsToken(
      FromAmount,
      pairs,
      true
    );
    setToBuy(addLiquidityAssets);
    methods.setValue(
      "ToAmount",
      addLiquidityAssets.to.toString().split(" ")[0]
    );
  };

  useEffect(() => {
    if (selectedTokens && selectedTokens.length === 2) {
      const trade = selectedTokens[0].allowedTrades.find((currentTrade) => {
        return currentTrade.token === selectedTokens[1].name;
      });
      const poolNotFound =
        pools.length === 0 ||
        pools.find((p) => p.supply.split(" ")[1] === trade.pool) === undefined;
      const { FromToken, ToToken } = methods.getValues();
      if (poolNotFound && FromToken && ToToken) {
        setPairs(null); // reset pairs
        setLoadingPairs(true);
        const fetchData = async () => {
          try {
            const result = await getPoolInfo(trade.pool);
            poolDispatch({ type: "SET_POOL", payload: result.rows[0] });

            getPairForSwap(FromToken, ToToken, authContext, [
              result.rows[0],
            ]).then((p) => {
              setLoadingPairs(false);
              setPairs(p);
              updateAmountsOnSelectedToken(p);
            });
          } catch (ex) {
            console.error(ex);
          }
        };
        fetchData();
      }
    }
  }, [poolDispatch, selectedTokens, authContext]);

  useEffect(() => {
    tokenDispatch({ type: "CLEAN_SELECTED_TOKEN" });
    poolDispatch({ type: "CLEAN_SELECTED_POOL" });
    isLoading(false);
  }, [tokenDispatch, poolDispatch, isLoading]);

  const onSubmit = async () => {
    if (!authContext.activeUser) {
      authContext.showModal();
      return;
    }
    setTransactionModalShow(true);
    setTransactionStatus(initialTransactionStatus);
    try {
      const { transactionId } = await addLiquidity(
        toBuy.baseAssetAmt,
        pairs,
        authContext
      );
      setTransactionStatus({
        status: TRANSACTION_STATUS.CONFIRMED,
        txid: transactionId,
      });
    } catch (e) {
      console.log(e);
      setTransactionStatus({
        status: TRANSACTION_STATUS.ERROR,
        error: e.message,
      });
    }
  };

  const openModal = useCallback(
    (callback, name) => {
      setTokenModalShow(true);
      setCallBackSwap({ func: callback, prevToken: name });
    },
    [setTokenModalShow, setCallBackSwap, tokenDispatch]
  );

  const closeModal = useCallback(
    ({ name, icon, contract, precision }) => {
      setTokenModalShow(false);
      if (callBackSwap && callBackSwap.prevToken) {
        tokenDispatch({
          type: "UNSELECT_TOKEN",
          payload: callBackSwap.prevToken,
        });
      }
      callBackSwap.func({
        name,
        icon,
        contract,
        precision,
      });
      tokenDispatch({ type: "SELECT_TOKEN", payload: name });
    },
    [callBackSwap, tokenDispatch]
  );

  const handleAmountOnChange = useCallback(
    (value, field) => {
      if (!pools || pools.length === 0 || !pairs) {
        switch (field) {
          case "FromBalanceClick":
            methods.setValue("FromAmount", value.toString().split(" ")[0]);
            break;
          case "ToBalanceClick":
            methods.setValue("ToAmount", value.toString().split(" ")[0]);
            break;
          default:
            break; // no pools
        }
        return; // no pools
      }
      const addLiquidityAssets = getAddLiquidityAssetsToken(
        value,
        pairs,
        field === "FromAmount" || field === "FromBalanceClick"
      );
      switch (field) {
        case "FromAmount":
          setToBuy(addLiquidityAssets);
          methods.setValue(
            "ToAmount",
            addLiquidityAssets.to.toString().split(" ")[0]
          );
          break;
        case "ToAmount":
          setToBuy(addLiquidityAssets);
          methods.setValue(
            "FromAmount",
            addLiquidityAssets.from.toString().split(" ")[0]
          );
          break;
        case "FromBalanceClick":
          methods.setValue("FromAmount", value.toString().split(" ")[0]);
          setToBuy(addLiquidityAssets);
          methods.setValue(
            "ToAmount",
            addLiquidityAssets.to.toString().split(" ")[0]
          );
          break;
        case "ToBalanceClick":
          methods.setValue("ToAmount", value.toString().split(" ")[0]);
          setToBuy(addLiquidityAssets);
          methods.setValue(
            "FromAmount",
            addLiquidityAssets.from.toString().split(" ")[0]
          );
          break;
        default:
          break;
      }
    },
    [pools, pairs]
  );

  if (loading) {
    return <></>;
  }

  const onInputClick = (value, field, ref) => {
    const initValue = parseFloat(value) ? parseFloat(value) : 0;
    const handleClickout = (e) => {
      const updatedValue = parseFloat(methods.getValues(field))
        ? parseFloat(methods.getValues(field))
        : 0;
      if (ref.current && !ref.current.contains(e.target)) {
        if (updatedValue === 0) {
          methods.setValue(field, "0.000");
        } else {
          methods.setValue(field, methods.getValues(field));
        }
        document.removeEventListener("click", handleClickout);
      }
    };
    if (initValue === 0) {
      methods.setValue(field, " ");
      document.addEventListener("click", handleClickout);
    } else {
      methods.setValue(field, value);
      document.addEventListener("click", handleClickout);
    }
  };

  const resetValues = () => {
    refreshInStorage.checkRefreshStorage();
    setRefreshArray([
      ...refreshArray,
      { contract: token1.contract, name: token1.name },
      { contract: token2.contract, name: token2.name },
    ]);
    tokenDispatch({ type: "CLEAN_SELECTED_TOKEN"});
    poolDispatch({ type: "CLEAN_SELECTED_POOL" });
    setPairs();
    const defaultToken1 = tokens.find((token) => token.isDefault);
    setToken1(defaultToken1);
    methods.setValue("ToAmount", "0.000");
    setToken2();
    methods.setValue("FromAmount", "0.000");
  };

  return (
    <Layout update={updateTokens}>
      <Container className="p-2 mt-3" fluid>
        <FormProvider {...methods}>
          <Row>
            <Col>
              <CardTitle
                title={t("liquidity")}
                role="img"
                aria-label={t("liquidity")}
                className="brain"
                icon="💸"
              />
              <MainCard className="mx-auto shadow-sm">
                {loadingPairs && <Loading cover />}
                <Card.Body>
                  {marketId && <CardMarketTitle marketId={marketId} />}
                  <Form onSubmit={methods.handleSubmit(onSubmit)}>
                    {token1 ? (
                      <InitialSwapContainer
                        token={token1}
                        setToken={setToken1}
                        header="From"
                        setModalShow={setTokenModalShow}
                        onSwapTokenClick={openModal}
                        onSwapTokenChange={handleAmountOnChange}
                        onInputClick={onInputClick}
                      />
                    ) : (
                      <DisabledSwapContainer>
                        <InitialSwapContainer
                          token="null"
                          setToken={setToken1}
                          header="From"
                          setModalShow={setTokenModalShow}
                          onSwapTokenClick={openModal}
                          onSwapTokenChange={handleAmountOnChange}
                          onInputClick={onInputClick}
                        />
                      </DisabledSwapContainer>
                    )}
                    <div className="d-flex justify-content-center">
                      <IconWrapper bsPrefix="switch">
                        <Plus />
                      </IconWrapper>
                    </div>
                    <SwapContainer
                      token={token2}
                      setToken={setToken2}
                      header="To"
                      initialToken={null}
                      setModalShow={setTokenModalShow}
                      onSwapTokenClick={openModal}
                      onSwapTokenChange={handleAmountOnChange}
                      onInputClick={onInputClick}
                      hideLabel
                    />
                    <PricePerToken control={methods.control} pairs={pairs} />
                    <Button
                      variant="primary"
                      type="submit"
                      size="lg"
                      block
                      className="text-capitalize mt-2"
                    >
                      {t("add_liquidity")}
                    </Button>
                  </Form>
                </Card.Body>
              </MainCard>

              {selectedTokens.length === 2 && (
                <InfoPoolCard
                  control={methods.control}
                  pools={pools}
                  pairs={pairs}
                  toBuy={toBuy}
                />
              )}
              {authContext.activeUser ? (
                <UserLiquidityCard />
              ) : (
                <>
                  <Row>
                    <Col>
                      <InfoAlert text={t("login_info")} />
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <YourLiquidityCard className="mx-auto"> 
                        <YourLiquidityCard.Title>
                          Your Liquidity
                          <span className="record" hidden>
                            Liquidity Record
                            {" >"}
                          </span>
                        </YourLiquidityCard.Title>
                        <YourLiquidityCard.Body>
                          Login in to view your liquidity.....
                        </YourLiquidityCard.Body>
                      </YourLiquidityCard>
                    </Col>
                  </Row>
                </>
              )}
            </Col>
          </Row>
          <TokenListModal
            onSelectToken={closeModal}
            show={tokenModalShow}
            onHide={() => setTokenModalShow(false)}
            callBackSwap={callBackSwap}
          />
          <TransactionModal
            status={transactionStatus}
            show={transactionModalShow}
            onHide={() => {
              setTransactionModalShow(false);
              if (transactionStatus.status === TRANSACTION_STATUS.CONFIRMED) {
               resetValues();
              }
            }}
          />
        </FormProvider>
      </Container>
    </Layout>
  );
};

export default React.memo(PoolsPage);
