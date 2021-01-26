import { Col, Container, Modal, Row, Form, Button } from "react-bootstrap";
import React, { useContext, useState } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { WallerProviderContext as UALContext } from "../../context/walletProvider/walletProviderFacade";
import GlobalStyle from "../globalStyles";
import { convertSharesTx } from "../../utils/EosDataProvider";
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
  }
`;

const UserTokenIcon = styled.img`
  width: 100px;
`;

const formatQuantity = (amount, precision) => {
  return parseFloat(amount) * 10 ** precision;
};

const initialDialogState = {
  dialogOpen: false,
  status: { status: TRANSACTION_STATUS.LOADING },
};

const ConvertSharesToTokensModal = ({ item, closeModal, ...otherProps }) => {
  const { t } = useTranslation();
  const [txModalInfo, setTxModalInfo] = useState(initialDialogState);
  const authContext = useContext(UALContext);
  const { handleSubmit, register, setValue } = useForm();

  const onSubmit = async ({ amount }) => {
    setTxModalInfo({
      dialogOpen: true,
      status: { status: TRANSACTION_STATUS.LOADING },
    });
    const amountWithPrecision = formatQuantity(amount, item.asset.precision);
    const accountName = await authContext.activeUser.getAccountName();
    const shareType = item.symbol === "YES";
    const tx = convertSharesTx(
      shareType,
      item.market.id,
      amountWithPrecision,
      accountName
    );
    try {
      await authContext.activeUser.signTransaction(tx, {
        broadcast: true,
        expireSeconds: 300,
      });
      setTxModalInfo({
        dialogOpen: true,
        status: { status: TRANSACTION_STATUS.CONFIRMED },
      });
    } catch (err) {
      setTxModalInfo({
        dialogOpen: true,
        status: { status: TRANSACTION_STATUS.ERROR },
      });
      console.error(err);
    }
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
                    src={item.token.icon}
                    alt={item.token.name}
                    title={item.token.name}
                  />
                  <div
                    className="text-max-shares mt-1"
                    onClick={() =>
                      setValue(
                        "amount",
                        `${
                          item.quantity_available / 10 ** item.asset.precision
                        }`
                      )
                    }
                  >
                    {t("max_shares")}:{" "}
                    {item.quantity_available / 10 ** item.asset.precision} {item.token.name}
                  </div>
                </div>
                <Form.Control
                  type="text"
                  name="amount"
                  placeholder={t("amount_shares_convert")}
                  ref={register({ required: true })}
                />
                <Button
                  variant="primary"
                  type="submit"
                  size="lg"
                  className="text-capitalize mt-2"
                  block
                >
                  {t("convert")}
                </Button>
              </Form>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </StyledModal>
  );
};

ConvertSharesToTokensModal.propTypes = {
  item: PropTypes.object.isRequired,
  closeModal: PropTypes.func.isRequired,
};

export default ConvertSharesToTokensModal;
