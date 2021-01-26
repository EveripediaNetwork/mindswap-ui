import PropTypes from "prop-types";
import React, { useContext, useEffect } from "react";
import { Button, Container, Nav, Navbar, Form } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  inIframe,
  WallerProviderContext as UALContext,
} from "../../context/walletProvider/walletProviderFacade";
import GlobalStyle from "../globalStyles";
import { useUserTokensDispatch } from "../../context/userTokensProvider/userTokensContext";
import {
  updateTokenBalance,
  refreshTokenBalance,
} from "../../context/userTokensProvider/userTokensActions";
import LanguageSelector from "./LanguageMenu/LanguageSelector";
import Settings from "./Settings/Settings";
import { useTokensDispatch } from "../../context/tokensProvider/tokensContext";
import { updateTokens } from "../../context/tokensProvider/tokensActions";
import ManageRefreshStorage from "../../utils/manageRefreshStorage";

const ContainerFloatToBottom = styled.div`
  display: none;
  position: absolute;
  right: 0;
`;

const Layout = ({ children, update }) => {
  const location = useLocation();
  const authContext = useContext(UALContext);
  const tokensDispatch = useTokensDispatch();
  const dispatch = useUserTokensDispatch();
  const user = authContext.activeUser;
  const { t, i18n } = useTranslation();
  const LngUrl = `?lng=${i18n.language}`;

  useEffect(() => {
    if (update) {
      updateTokens(tokensDispatch);
    }
    if (user) {
      const timeNow = new Date().getTime();
      const timeExpire = ManageRefreshStorage.timeExpireInt();
      if (!timeExpire || (timeExpire && timeNow > timeExpire)) {
        updateTokenBalance(user, dispatch);
        ManageRefreshStorage.clearRefreshItems();
      } else {
        const query = ManageRefreshStorage.getRefreshQuery();
        refreshTokenBalance(user, query, dispatch);
      }
    }
  }, [dispatch, user]);
  const isInIframe = inIframe();
  console.log("refreshing layout");
  return (
    <Container className="container-sm">
      <GlobalStyle />
      {isInIframe ? (
        <ContainerFloatToBottom>
          <Settings />
        </ContainerFloatToBottom>
      ) : (
        <Navbar expand="lg" className="p-3 font-weight-bold text-capitalize">
          <Navbar.Brand as={Link} to={`/${LngUrl}`}>
            <span title="mindswap" role="img" aria-label="brain">
              🧠
            </span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link
                active={location.pathname === "/"}
                as={Link}
                to={`/${LngUrl}`}
              >
                {t("swap")}
              </Nav.Link>
              <Nav.Link
                active={location.pathname === "/pool"}
                as={Link}
                to={`/pool${LngUrl}`}
              >
                {t("pool")}
              </Nav.Link>
              <Nav.Link
                active={location.pathname === "/convert"}
                as={Link}
                to={`/convert${LngUrl}`}
              >
                {t("convert")}
              </Nav.Link>
            </Nav>
            <LanguageSelector />
            <Settings />
            <Form inline>
              {authContext.activeUser === null ? (
                <Button
                  onClick={authContext.showModal}
                  className="text-capitalize"
                >
                  {t("connect_wallet")}
                </Button>
              ) : (
                <Button
                  onClick={authContext.logout}
                  className="text-capitalize"
                >
                  {t("logout")}
                </Button>
              )}
            </Form>
          </Navbar.Collapse>
        </Navbar>
      )}
      {children}
    </Container>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  update: PropTypes.bool.isRequired,
};

export default Layout;
