import React, { useState, useContext } from "react";
import styled from "styled-components";
import {
  Modal,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  ButtonToolbar,
  InputGroup,
  FormControl,
  Nav,
  Alert,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import SlippageContext from "../../../context/settingsProvider/InitialSettingsContext";
import { isDesktop, defaultSlippage } from "../../../constants/index";

const EmojiWrapper = styled.span`
  font-size: 1.5rem;
  margin-right: 1rem;
  cursor: pointer;
`;

const StyledModal = styled(Modal)`
  div {
    border-radius: 15px;
  }

  .modal-title {
    font-size: 20px;
    color: #692b94;
  }
`;

const StyledButtonToolbar = styled(ButtonToolbar)`
  margin-top: 2%;
  margin-bottom: 4%;
`;

const StyledSubtitle = styled.h1`
  font-size: 16px;
  font-weight: 300;
`;

const Disclaimer = styled.p`
  font-size: 14px;
  color: #999;
`;

const StyledInputGroup = styled(InputGroup)`
  width: 43% !important;
  &&& input {
    border-right: 0px;
    padding-right: 0px;
  }
  .input-group-text {
    background-color: white;
    padding-left: 0px;
  }
`;

const StyledNavItem = styled(Nav.Item)`
  padding: 8px 0 16px 0;
`;

const Settings = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const { slippageLimit, setSlippageLimit } = useContext(SlippageContext);
  const [slippageValue, setSlippageValue] = useState(slippageLimit);

  const openSettingsModal = () => {
    setSlippageValue(parseInt(slippageLimit, 10));
    setShowModal(!showModal);
  };

  const changeSlippage = (e) => {
    setSlippageValue(e);
  };

  const changeSlippageInput = (e) => {
    if (!e.target.value) {
      setSlippageValue("");
    } else {
      setSlippageValue(parseInt(e.target.value, 10));
    }
  };

  const confirmSettings = () => {
    if (slippageValue < 100 && slippageValue >= 0 && slippageValue) {
      localStorage.setItem("slippageTolerance", slippageValue);
      setSlippageLimit(slippageValue);
      setShowWarning(false);
      setShowModal(!showModal);
    } else {
      setShowWarning(true);
      setTimeout(function () {
        setShowWarning(false);
      }, 6000);
    }
  };

  return (
    <>
      {isDesktop ? (
        <EmojiWrapper onClick={openSettingsModal}>⚙️</EmojiWrapper>
      ) : (
        <StyledNavItem onClick={openSettingsModal}>
          {t("settings")}
        </StyledNavItem>
      )}
      <StyledModal show={showModal} onHide={openSettingsModal} centered>
        <Alert show={showWarning} variant="danger">
          The value entered is out of bounds, try a number between 0-100
        </Alert>
        <Modal.Header closeButton>
          <Modal.Title>{t("transaction_settings")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <StyledSubtitle>{t("slippage_tolerance")}</StyledSubtitle>
          <StyledButtonToolbar className="justify-content-between">
            <ToggleButtonGroup
              type="radio"
              name="slippage-options"
              value={slippageValue}
              onChange={changeSlippage}
            >
              <ToggleButton value={1}>1%</ToggleButton>
              <ToggleButton value={5}>5%</ToggleButton>
              <ToggleButton value={10}>10%</ToggleButton>
            </ToggleButtonGroup>
            <StyledInputGroup>
              <FormControl
                type="number"
                placeholder={slippageValue}
                aria-label="5"
                aria-describedby="btnGroupAddon"
                value={slippageValue}
                onChange={changeSlippageInput}
              />
              <InputGroup.Append>
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup.Append>
            </StyledInputGroup>
          </StyledButtonToolbar>
          <Disclaimer>{t("settings_statement")}</Disclaimer>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={confirmSettings} block>
            {t("confirm")}
          </Button>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default Settings;
