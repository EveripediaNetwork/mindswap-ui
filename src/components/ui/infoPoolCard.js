import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Card } from "react-bootstrap";
import PropTypes from "prop-types";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

const SubCard = styled(Card)`
  max-width: 400px;
  z-index: -1;
  top: -22px;
  margin-top: 12px;

  .card-body {
    padding: 0.35rem !important;
  }
`;

const SwapInfo = styled.div`
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

const InfoPoolCard = ({ control, pools, pairs, toBuy }) => {
  const { t } = useTranslation();
  const [fee, setFee] = useState();

  const { liquidityAmount } = useWatch(control);

  useEffect(() => {
    if (!pools || pools.length === 0) {
      return; // no pools
    }
    // TODO: calculate data from pool

    if (pairs) {
      setFee(pairs.fee / 100.0);
    }
  }, [pools, pairs, liquidityAmount]);

  let pctOfPool;
  if (pools && pools.length && toBuy) {
    pctOfPool = (
      (Number(toBuy.baseAsset.amount) /
        (Number(pairs?.supply.amount) + Number(toBuy.baseAsset.amount))) *
      100
    ).toFixed(pairs?.supply.symbol.precision());
  }

  return (
    <SubCard className="mx-auto shadow-none">
      <Card.Body>
        <SwapInfo>
          {pairs?.supply?.amount ? (
            <div className="infoLine">
              <div>{t("current_supply")}</div>
              <div className="infoData">{pairs?.supply?.toString()} </div>
            </div>
          ) : null}
          {toBuy?.asset1 && toBuy?.asset2 ? (
            <>
              <div className="infoLine">
                <div>{t("pool_shares")}</div>
                <div className="infoData">{toBuy.baseAsset.toString()}</div>
              </div>
              <div className="infoLine">
                <div>{t("pool_shares_pct")}</div>
                <div className="infoData">{pctOfPool} %</div>
              </div>
              <div className="infoLine">
                <div className="text-capitalize">{t("add_liquidity")}</div>
                <div className="infoData">
                  {`${toBuy.asset1.toString()} and ${toBuy.asset2.toString()}`}
                </div>
              </div>
            </>
          ) : null}
        </SwapInfo>
      </Card.Body>
    </SubCard>
  );
};

InfoPoolCard.propTypes = {
  control: PropTypes.any,
  pools: PropTypes.any,
  pairs: PropTypes.any,
  toBuy: PropTypes.any,
};

export default InfoPoolCard;
