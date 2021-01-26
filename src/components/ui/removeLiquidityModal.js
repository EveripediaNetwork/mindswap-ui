import { Col, Container, Modal, Row, Form, Button } from "react-bootstrap";
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { WallerProviderContext as UALContext } from "../../context/walletProvider/walletProviderFacade";
import GlobalStyle from "../globalStyles";
import {
  convertToPairFormat,
  getPoolInfo,
  getRemoveLiquidityAssets,
  removeLiquidity,
} from "../../utils/EosDataProvider";
import TransactionModal, { TRANSACTION_STATUS } from "./transactionModal";

const StyledModal = styled(Modal)`
  div {
    max-width: 400px;
    border-radius: 15px;
    border-bottom: 0;
  }

  .modal-body {
    min-height: 250px;
    padding: 0.5rem !important;

    .text-max-shares {
      color: #aeabab;
      font-size: 14px;
    }

    .infoLine {
      display: grid;
      grid-template-columns: 200px auto;
      justify-content: space-between;
      font-size: 14px;
      color: #aeabab;
      margin: 8px;
    }
  }
`;

const UserTokenIcon = styled.img`
  width: 100px;
`;

const initialDialogState = {
  dialogOpen: false,
  status: { status: TRANSACTION_STATUS.LOADING },
};

const RemoveLiquidityModal = ({ item, closeModal, ...otherProps }) => {
  const { t } = useTranslation();
  const [txModalInfo, setTxModalInfo] = useState(initialDialogState);
  const [removeLiquidityData, setRemoveLiquidityData] = useState(null);
  const [pair, setPair] = useState(null);
  const authContext = useContext(UALContext);
  const { handleSubmit, register } = useForm();
  const [inputValue, setInputValue] = useState();

  useEffect(() => {
    getPoolInfo(item.name).then((result) => {
      convertToPairFormat(null, result.rows[0]).then((p) => setPair(p));
    });
  }, [item.name]);

  const onSubmit = async ({ amount }) => {
    setTxModalInfo({
      dialogOpen: true,
      status: { status: TRANSACTION_STATUS.LOADING },
    });
    try {
      const { transactionId } = await removeLiquidity(
        amount,
        pair,
        authContext
      );
      setTxModalInfo({
        dialogOpen: true,
        status: { status: TRANSACTION_STATUS.CONFIRMED, txid: transactionId },
      });
    } catch (e) {
      setTxModalInfo({
        dialogOpen: true,
        status: { status: TRANSACTION_STATUS.ERROR, error: e.message },
      });
    }
  };

  const onAmountChange = async (e) => {
    let value;
    if (e && e.target && e.target.value) {
      value = e?.target?.value;
    } else if (e.target && !e.target.value){
      value = "";
    } else {
      value = e;
    }

    setInputValue(value);
    const liquidityReturn = getRemoveLiquidityAssets(value, pair);
    setRemoveLiquidityData(liquidityReturn);
  };

  if (txModalInfo.dialogOpen) {
    return (
      <TransactionModal
        status={txModalInfo.status}
        show={txModalInfo.dialogOpen}
        onHide={() => {
          setTxModalInfo(initialDialogState);
          closeModal();
        }}
      />
    );
  }

  return (
    <StyledModal
      {...otherProps}
      size="md"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      scrollable
    >
      <Modal.Body>
        <Container fluid>
          <GlobalStyle />
          <Row>
            <Col>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="text-center mb-3">
                  <UserTokenIcon
                    src={item.icon}
                    alt={item.name}
                    title={item.name}
                  />
                  <div
                    className="text-max-shares mt-1"
                    onClick={() =>
                      onAmountChange(`${item.balance / 10 ** item.precision}`)
                    }
                  >
                    {t("max_shares")}:{item.balance / 10 ** item.precision}{" "}
                    {item.name}
                  </div>
                </div>
                <Form.Control
                  type="text"
                  name="amount"
                  placeholder={t("amount_of_liquidity_to_remove")}
                  autoComplete="off"
                  ref={register({ required: true })}
                  value={inputValue || ""}
                  onChange={onAmountChange}
                />
                {removeLiquidityData && (
                  <>
                    <div className="infoLine">
                      <div>
                        {removeLiquidityData.asset1.symbol.code().toString()}
                      </div>
                      <div>{removeLiquidityData.asset1.toString()}</div>
                    </div>
                    <div className="infoLine">
                      <div>
                        {removeLiquidityData.asset2.symbol.code().toString()}
                      </div>
                      <div>{removeLiquidityData.asset2.toString()}</div>
                    </div>
                  </>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  size="lg"
                  className="text-capitalize mt-2"
                  block
                >
                  {t("remove_liquidity")}
                </Button>
              </Form>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </StyledModal>
  );
};

RemoveLiquidityModal.propTypes = {
  item: PropTypes.object.isRequired,
  closeModal: PropTypes.func.isRequired,
};

export default RemoveLiquidityModal;
