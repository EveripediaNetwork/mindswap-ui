import { Button, ListGroup } from "react-bootstrap";
import styled from "styled-components";
import React, { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { WallerProviderContext as UALContext } from "../../context/walletProvider/walletProviderFacade";
import {
  useUserSharesDispatch,
  useUserSharesState,
} from "../../context/userSharesProvider/userSharesContext";
import { 
  useTokensState,
  useTokensDispatch,
} from "../../context/tokensProvider/tokensContext";
import { updateTokens } from "../../context/tokensProvider/tokensActions";
import { updateSharesBalance } from "../../context/userSharesProvider/userSharesActions";
import { prediqtUrl } from "../../config";

const SharesDataWrapper = styled.div`
  display: inline-block;
  font-size: 11px;
  margin-left: 6px;
  vertical-align: middle;
`;

const UserTokenIcon = styled.img`
  width: 30px;
`;

const ListUserToken = styled(ListGroup.Item)`
  display: grid !important;
  grid-template-columns: auto auto;
  justify-content: space-between;
`;

const ListUserSharesWrapper = ({ onClickConvertShare, refresh }) => {
  const { t } = useTranslation();
  const userSharesDispatch = useUserSharesDispatch();
  const authContext = useContext(UALContext);
  const user = authContext.activeUser;
  const { tokens } = useTokensState();
  const userTokensDispatch = useTokensDispatch();
  const { userShares } = useUserSharesState();

  useEffect(() => {
    if (tokens.length === 0) {
      updateTokens(userTokensDispatch);
    }
    if (user !== null) {
      updateSharesBalance(user, tokens, userSharesDispatch);
    }
  }, [userSharesDispatch, user, tokens, refresh]);

  return (
    <ListGroup variant="flush">
      {userShares.map((share) => (
        <ListUserToken key={`${share.market.id}-${share.symbol}`}>
          <div>
            <UserTokenIcon
              src={share.token.icon}
              alt={share.token.name}
              title={share.token.name}
            />
            <SharesDataWrapper className="text-capitalize">
              {t("market")}:{" "}
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={`${prediqtUrl}/market/${share.market.id}`}
              >
                {share.market.id}
              </a>
              <br />
              {t("shares")}:{" "}
              {share.quantity_available / 10 ** share.asset.precision}{" "}
              {share.symbol}
            </SharesDataWrapper>
          </div>
          <div>
            <Button
              size="sm"
              className="mr-1 text-capitalize"
              onClick={() =>
                onClickConvertShare({ dialogOpen: true, item: share })
              }
            >
              {t("convert")}
            </Button>
          </div>
        </ListUserToken>
      ))}
    </ListGroup>
  );
};

ListUserSharesWrapper.propTypes = {
  onClickConvertShare: PropTypes.func.isRequired,
  refresh: PropTypes.bool.isRequired,
};

export default ListUserSharesWrapper;
