import React, { useEffect, useState, useContext } from "react";
import { Card } from "react-bootstrap";
import styled from "styled-components";
import { WallerProviderContext as UALContext } from "../../context/walletProvider/walletProviderFacade";
import Loading from "../../features/loading";
import {
  useUserPoolDispatch,
  useUserPoolState,
} from "../../context/userPoolProvider/userPoolContext";
import { updateUserPool } from "../../context/userPoolProvider/userPoolActions";
import { asset } from "eos-common";
import { mergePoolObjects } from "../../utils/EosDataProvider";

const LiquidityCard = styled(Card)`
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
  }
`;

const PairCard = styled(Card)`
  width: 48%;
  min-width: 260px !important;
  max-width: 800px !important;
  margin-bottom: 1%;
  padding: 1%;
  @media (max-width: 1000px) {
    width: 98%;
  }
`;

const LiquidInfo = styled.div`
  width: 95%;
  .infoLine {
    display: grid;
    grid-template-columns: auto auto;
    justify-content: space-between;
    font-size: 14px;
    color: #aeabab;
    margin: 8px;
  }
  .infoData {
    text-align: right;
  }
`;

const ManageButton = styled.button`
  font-size: 10px;
  color: #924db3;
  border: 1px solid #542376;
  background-color: #ffffff;
  padding: 0 4% !important;
`;

const UserTokenIcon = styled.img`
  position: relative;
  bottom: 10%;
  width: 30px;
`;
const UserLiquidityCard = () => {
  const [info, setInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const authContext = useContext(UALContext);
  const user = authContext.activeUser;

  const userPoolDispatch = useUserPoolDispatch();
  const { userPool } = useUserPoolState();

  useEffect(() => {
    updateUserPool(user, userPoolDispatch);
  }, [userPoolDispatch, user]);

  const mergingPoolObjects = (source, target) => {
    const mergedObjects = [];
    source.forEach((sourceElement) => {
      const targetFound = target.find(
        (targetElement) => targetElement.key === sourceElement.name
      );
      if (targetFound) {
        const newSource = mergePoolObjects(sourceElement, targetFound);
        mergedObjects.push(newSource);
      }
    });
    setIsLoading(false);
    return mergedObjects;
  };

  useEffect(() => {
    if (userPool && userPool.current) {
      const PoolInfo = userPool.current
        .filter((pool) => pool.balance > 0)
        .map((pool) => {
          const obj = {};
          obj.balance = pool.balance;
          obj.precision = pool.precision;
          obj.name = pool.name;
          obj.namepool1 = pool.name.replace("IQ", "");
          obj.namepool2 = "IQ";
          obj.icon1 = pool.icon;
          obj.icon2 = "tokens/iq.png";
          return obj;
        });
      const mergedObjects = mergingPoolObjects(PoolInfo, userPool.pools);
      setInfo(mergedObjects);
    }
  }, [userPool]);

  return (
    <LiquidityCard className="mx-auto">
      {isLoading && <Loading cover />}
      <LiquidityCard.Title>
        Your Liquidity
        <span className="record" hidden>
          Liquidity Record
          {" >"}
        </span>
      </LiquidityCard.Title>
      <LiquidityCard.Body>
        {info &&
          info[0] &&
          info.map((pair) => (
            <PairCard key={pair.name}>
              <PairCard.Title>
                <div>
                  <UserTokenIcon src={pair.icon1} />
                  <span> {pair.namepool1}</span>
                  <span> + </span>
                  <UserTokenIcon src={pair.icon2} />
                  <span> {pair.namepool2}</span>
                </div>
                <ManageButton hidden>Manage</ManageButton>
              </PairCard.Title>
              <PairCard.Body>
                <LiquidInfo>
                  <div className="infoLine">
                    <div>Current Liquidity</div>
                    <div className="infoData">
                      {pair.liquidity1}/{pair.liquidity2}
                    </div>
                  </div>
                  <div className="infoLine">
                    <div>Total Market Liquidity</div>
                    <div className="infoData">
                      {pair.marketLiq1}/{pair.marketLiq2}
                    </div>
                  </div>
                  <div className="infoLine">
                    <div>Liquidity Ratio</div>
                    <div className="infoData">{pair.ratio}%</div>
                  </div>
                  <div className="infoLine">
                    <div>Balance</div>
                    <div className="infoData">
                      {pair.formatBalance} {pair.name}
                    </div>
                  </div>
                </LiquidInfo>
              </PairCard.Body>
            </PairCard>
          ))}
      </LiquidityCard.Body>
    </LiquidityCard>
  );
};

export default UserLiquidityCard;
