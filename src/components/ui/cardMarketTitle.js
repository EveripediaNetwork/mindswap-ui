import { Image } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ExclamationOctagonFill } from "react-bootstrap-icons";

import PropTypes from "prop-types";
import { getMarketInfo } from "../../utils/PrediqtDataProvider";
import { prediqtUrl } from "../../config";

const CardTitle = styled.div`
  font-size: 20px !important;
  font-weight: bolder;
  line-height: 1.2;
  margin-bottom: 15px;
  a {
    display: grid !important;
    grid-template-columns: auto auto;
    justify-content: space-between;
    .grid {
      display: inline-block !important;
    }
  }
`;

const MarketImageThumbnail = styled(Image)`
  width: 70px;
  margin-right: 10px;
  max-height: 70px;
`;

const CardMarketTitle = ({ marketId }) => {
  const [marketInfo, setMarketInfo] = useState(null);
  useEffect(() => {
    (async () => {
      if (marketId) {
        setMarketInfo(await getMarketInfo(marketId));
      }
    })();
  }, [marketId]);

  const marketResolved = marketInfo?.state === "RESOLVED";

  return marketInfo ? (
    <CardTitle>
      {marketResolved && (
        <div
          style={{
            color: "red",
            fontSize: "20px",
            padding: "0 0 10px",
            justifyContent: "center",
            alignItems: "center",
            gridTemplateColumns: "20px auto 20px",
            display: "grid",
          }}
        >
          <ExclamationOctagonFill color="red" size={20} />
          <div style={{ padding: "0 10px" }}>
            This market has been resolved to: {marketInfo?.resolution}
          </div>
          <ExclamationOctagonFill color="red" size={20} />
        </div>
      )}
      <a
        href={`${prediqtUrl}/market/${marketInfo.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="grid">
          <MarketImageThumbnail src={marketInfo.image} rounded />
        </div>
        <div className="grid">{marketInfo.title}</div>
      </a>
    </CardTitle>
  ) : (
    <></>
  );
};

CardMarketTitle.propTypes = {
  marketId: PropTypes.number.isRequired,
};

export default CardMarketTitle;
