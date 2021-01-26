import React, { useState } from "react";
import { Card, Col, Container, Row, Tab } from "react-bootstrap";
import Tabs from "react-bootstrap/Tabs";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import Layout from "../components/layouts/layout";
import CardTitle from "../components/ui/cardTitle";
import ListUserSharesWrapper from "../components/ui/listUserSharesWrapper";
import ListUserTokenWrappers, {
  LIST_TYPES,
} from "../components/ui/listUserTokenWrappers";
import ConvertTokensToSharesModal from "../components/ui/convertTokensToSharesModal";
import ConvertSharesToTokensModal from "../components/ui/convertSharesToTokensModal";
import RemoveLiquidityModal from "../components/ui/removeLiquidityModal";

const StyledTabs = styled(Tabs)`
  justify-content: center;
  margin-bottom: 20px !important;
`;

const initialDialogState = { dialogOpen: false, item: undefined };

const ConvertPage = () => {
  const { t } = useTranslation();
  const [refreshValues, setRefreshValues] = useState(false);

  const [convertTokenModalShow, setConvertTokenModalShow] = useState(
    initialDialogState
  );
  const [convertShareModalShow, setConvertShareModalShow] = useState(
    initialDialogState
  );
  const [removeLiquidityModalShow, setRemoveLiquidityModalShow] = useState(
    initialDialogState
  );
  return (
    <Layout update={false}>
      <Container className="p-2 mt-3" fluid>
        <Row>
          <Col>
            <CardTitle
              title={t("convert")}
              role="img"
              aria-label={t("convert")}
              className="brain"
              icon="💹"
            />
            <Card className="mx-auto shadow-sm">
              <Card.Body>
                <StyledTabs
                  className="text-capitalize"
                  variant="pills"
                  defaultActiveKey={LIST_TYPES.TOKENS}
                  id="convert-page"
                >
                  <Tab
                    eventKey={LIST_TYPES.TOKENS}
                    title={t(LIST_TYPES.TOKENS)}
                  >
                    <ListUserTokenWrappers
                      type={LIST_TYPES.TOKENS}
                      onClickConvertToken={setConvertTokenModalShow}
                      refresh={refreshValues}
                    />
                  </Tab>
                  <Tab
                    eventKey={LIST_TYPES.LIQUIDITY}
                    title={t(LIST_TYPES.LIQUIDITY)}
                  >
                    <ListUserTokenWrappers
                      type={LIST_TYPES.LIQUIDITY}
                      onClickConvertToken={setRemoveLiquidityModalShow}
                      refresh={refreshValues}
                    />
                  </Tab>
                  <Tab
                    eventKey={LIST_TYPES.SHARES}
                    title={t(LIST_TYPES.SHARES)}
                  >
                    <ListUserSharesWrapper
                      onClickConvertShare={setConvertShareModalShow}
                      refresh={refreshValues}
                    />
                  </Tab>
                </StyledTabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {convertTokenModalShow.item && (
          <ConvertTokensToSharesModal
            item={convertTokenModalShow.item}
            show={convertTokenModalShow.dialogOpen}
            closeModal={() => {
              setConvertTokenModalShow(initialDialogState);
              setRefreshValues(!refreshValues);
            }}
            onHide={() => setConvertTokenModalShow(initialDialogState)}
          />
        )}

        {convertShareModalShow.item && (
          <ConvertSharesToTokensModal
            item={convertShareModalShow.item}
            show={convertShareModalShow.dialogOpen}
            closeModal={() => {
              setConvertShareModalShow(initialDialogState);
              setRefreshValues(!refreshValues);
            }}
            onHide={() => setConvertShareModalShow(initialDialogState)}
          />
        )}

        {removeLiquidityModalShow.item && (
          <RemoveLiquidityModal
            item={removeLiquidityModalShow.item}
            show={removeLiquidityModalShow.dialogOpen}
            closeModal={() => {
              setRemoveLiquidityModalShow(initialDialogState);
              setRefreshValues(!refreshValues);
            }}
            onHide={() => setRemoveLiquidityModalShow(initialDialogState)}
          />
        )}
      </Container>
    </Layout>
  );
};

export default React.memo(ConvertPage);
