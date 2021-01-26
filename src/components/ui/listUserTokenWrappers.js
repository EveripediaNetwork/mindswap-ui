import React, { useEffect, useState } from "react";
import { Button, ListGroup } from "react-bootstrap";
import PropTypes from "prop-types";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useUserTokensState } from "../../context/userTokensProvider/userTokensContext";
import { formatTokenBalance } from "../../utils/EosDataProvider";
import { mindswapContract, prediqTokensContract } from "../../config";

const UserTokenIcon = styled.img`
  width: 30px;
`;

const ListUserToken = styled(ListGroup.Item)`
  display: grid !important;
  grid-template-columns: auto auto;
  justify-content: space-between;
`;

export const LIST_TYPES = {
  TOKENS: "tokens",
  LIQUIDITY: "liquidity",
  SHARES: "shares",
};

const ListUserTokenWrappers = ({ type, onClickConvertToken, refresh }) => {
  const { t } = useTranslation();
  const { userTokens } = useUserTokensState();
  const [filteredTokens, setFilteredTokens] = useState([]);

  useEffect(() => {
    let tokens = [];
    if (type === LIST_TYPES.TOKENS) {
      tokens = userTokens.filter(
        (token) => token.contract !== mindswapContract && token.balance > 0
      );
    }

    if (type === LIST_TYPES.LIQUIDITY) {
      tokens = userTokens.filter(
        (token) => token.contract === mindswapContract && token.balance > 0
      );
    }
    setFilteredTokens(tokens);
  }, [userTokens, type, setFilteredTokens, refresh]);

  return (
    <ListGroup variant="flush">
      {filteredTokens.map((token) => (
        <ListUserToken key={token.name}>
          <div>
            <UserTokenIcon src={token.icon} />{" "}
            {formatTokenBalance(token)} {token.name}
          </div>
          <div>
            {type === LIST_TYPES.TOKENS &&
              token.contract === prediqTokensContract && (
                <Button
                  size="sm"
                  className="mr-1 text-capitalize"
                  disabled={!token.balance}
                  onClick={() =>
                    onClickConvertToken({ dialogOpen: true, item: token })
                  }
                >
                  {t("convert")}
                </Button>
              )}
            {type === LIST_TYPES.LIQUIDITY &&
              token.contract === mindswapContract && (
                <Button
                  size="sm"
                  className="mr-1 text-capitalize"
                  disabled={!token.balance}
                  onClick={() =>
                    onClickConvertToken({ dialogOpen: true, item: token })
                  }
                >
                  {t("remove_liquidity")}
                </Button>
              )}
          </div>
        </ListUserToken>
      ))}
    </ListGroup>
  );
};

ListUserTokenWrappers.propTypes = {
  type: PropTypes.string.isRequired,
  onClickConvertToken: PropTypes.func.isRequired,
  refresh: PropTypes.bool.isRequired,
};

export default ListUserTokenWrappers;
