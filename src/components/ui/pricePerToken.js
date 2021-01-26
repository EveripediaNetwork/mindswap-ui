import { ArrowRepeat } from "react-bootstrap-icons";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "react-bootstrap";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useWatch } from "react-hook-form";
import { amountToAsset } from "../../utils/EosDataProvider";
import { prediqTokensContract } from "../../config";

const PriceWrapper = styled.div`
  font-size: 13px;
  padding: 15px 5px 15px 5px;
  color: #aeabab;
  display: grid;
  grid-template-columns: 50% auto;
  justify-content: space-between;
  .icon {
    margin-left: 3px;
    padding: 0;
    border: none;
    outline: none;
    font: inherit;
    color: inherit;
    background: none;
  }
`;

const PricePerToken = ({ control, pairs, selectedTokens }) => {
  const { t } = useTranslation();
  const [priceFrom, setPriceFrom] = useState(false);
  const [assetPrice, setAsset] = useState();
  const { FromAmount, ToAmount } = useWatch(control);

  useEffect(() => {
    if (pairs && FromAmount && ToAmount) {
      const assetToGive = amountToAsset(FromAmount, pairs.from.asset);
      const assetToReceive = amountToAsset(ToAmount, pairs.to.asset);
      const denomAsset = priceFrom ? assetToReceive : assetToGive;
      let amount = priceFrom
        ? (parseFloat(ToAmount) / parseFloat(FromAmount)).toFixed(
            denomAsset.symbol.precision()
          )
        : (parseFloat(FromAmount) / parseFloat(ToAmount)).toFixed(
            denomAsset.symbol.precision()
          );

      if (!isFinite(parseFloat(amount)) || isNaN(parseFloat(amount))) {
        amount = parseFloat(0).toFixed(denomAsset.symbol.precision());
      }
      if (amount > 0) {
        setAsset(amountToAsset(amount, denomAsset));
      }
    }
  }, [pairs, FromAmount, ToAmount, setAsset, priceFrom]);

  let priceOverOne = false;

  if (pairs && selectedTokens && selectedTokens.some((s) => s?.marketId >= 0)) {
    const denom =
      pairs.from.contract === prediqTokensContract
        ? amountToAsset(FromAmount, pairs.from.asset)
        : amountToAsset(ToAmount, pairs.to.asset);
    const numer =
      pairs.from.contract === prediqTokensContract
        ? amountToAsset(ToAmount, pairs.to.asset)
        : amountToAsset(FromAmount, pairs.from.asset);

    priceOverOne = parseFloat(numer.amount / denom.amount) > 1.0;
  }

  return (
    <PriceWrapper>
      {pairs && assetPrice && (
        <>
          <span>
            {t("price")}
            {priceOverOne ? (
              <span style={{ color: "red", padding: "0 5px" }}>
                (more than 1 IQ per share!)
              </span>
            ) : (
              ""
            )}
          </span>
          <span>
            <span>
              {`${assetPrice.to_string()} per ${(priceFrom
                ? pairs.from.asset.symbol
                : pairs.to.asset.symbol
              ).toString(false)}`}
            </span>
            <Button
              bsPrefix="switch"
              className="icon"
              onClick={() => setPriceFrom(!priceFrom)}
            >
              <ArrowRepeat />
            </Button>
          </span>
        </>
      )}
    </PriceWrapper>
  );
};

PricePerToken.propTypes = {
  control: PropTypes.object.isRequired,
  pairs: PropTypes.object,
};

export default PricePerToken;
