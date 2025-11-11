import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useHistory } from "react-router-dom";
import QRCode from 'react-qr-code';
import { SuccessContent, Total } from './style';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaCheckCircle } from 'react-icons/fa';
import { SocketContext } from "../../../context/Socket/SocketContext";
import { useDate } from "../../../hooks/useDate";
import { toast } from "react-toastify";

function CheckoutSuccess(props) {

  const { pix, userEmail } = props;
  const pixData = pix || {};
  const pixString = useMemo(() => pixData?.qrcode?.qrcode || "", [pixData]);
  const [copied, setCopied] = useState(false);
  const history = useHistory();

  const { dateToClient } = useDate();

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);
    
    socket.on(`company-${companyId}-payment`, (data) => {

      if (data.action === "CONCLUIDA") {
        toast.success(`Sua licença foi renovada até ${dateToClient(data.company.dueDate)}!`);
        setTimeout(() => {
          history.push("/");
        }, 4000);
      }
    });
  }, [history, socketManager]);

  const handleCopyQR = () => {
    setTimeout(() => {
      setCopied(false);
    }, 1 * 1000);
    setCopied(true);
  };

  if (!pixData || !pixData.qrcode) {
    return null;
  }

  const amount = Number(pixData?.valor?.original || 0);
  const qrImageBase64 = pixData?.qrcode?.imagemQrcode;
  const qrImageSrc = qrImageBase64
    ? qrImageBase64.startsWith("data:image")
      ? qrImageBase64
      : `data:image/png;base64,${qrImageBase64}`
    : null;

  return (
    <React.Fragment>
      <Total>
        <span>TOTAL</span>
        <strong>
          R${amount.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
        </strong>
      </Total>
      <SuccessContent>
        {userEmail && (
          <span style={{ marginBottom: 16 }}>
            E-mail para cobrança: <strong>{userEmail}</strong>
          </span>
        )}
        {qrImageSrc ? (
          <img
            src={qrImageSrc}
            alt="QR Code do PIX"
            style={{ width: 240, height: 240, borderRadius: 8 }}
          />
        ) : (
          <QRCode value={pixString} />
        )}
        <CopyToClipboard text={pixString} onCopy={handleCopyQR}>
          <button className="copy-button" type="button">
            {copied ? (
              <>
                <span>Copiado</span>
                <FaCheckCircle size={18} />
              </>
            ) : (
              <>
                <span>Copiar PIX</span>
                <FaCopy size={18} />
              </>
            )}
          </button>
        </CopyToClipboard>
        <span>
          Para finalizar, basta realizar o pagamento escaneando ou colando o
          código Pix acima :)
        </span>
      </SuccessContent>
    </React.Fragment>
  );
}

export default CheckoutSuccess;
