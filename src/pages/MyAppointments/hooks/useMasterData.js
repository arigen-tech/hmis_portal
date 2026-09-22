import { useState, useEffect } from 'react';
import { apiService } from '../../../services/apiService';
import { ENDPOINTS } from '../../../constants';

export function useMasterData() {
  const [cancelReasonsList, setCancelReasonsList] = useState([]);
  const [paymentGateways, setPaymentGateways] = useState([]);
  const [initialCancelReasonId, setInitialCancelReasonId] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('');

  useEffect(() => {
    let ignore = false;

    const fetchMasterData = async () => {
      try {
        const cancelRes = await apiService.get(ENDPOINTS.MASTER.CANCEL_REASON_MASTER);
        if (!ignore && cancelRes?.status === 200 && cancelRes?.response) {
          setCancelReasonsList(cancelRes.response);
          if (cancelRes.response.length > 0) {
            setInitialCancelReasonId(cancelRes.response[0].reasonId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch cancel reasons", err);
      }

      try {
        const gatewayRes = await apiService.get(ENDPOINTS.MASTER.PAYMENT_GATEWAY);
        if (!ignore && gatewayRes?.status === 200 && gatewayRes?.response) {
          setPaymentGateways(gatewayRes.response);
          if (gatewayRes.response.length > 0) {
            setInitialPaymentMethod(gatewayRes.response[0].gatewayCode);
          }
        }
      } catch (err) {
        console.error("Failed to fetch payment gateways", err);
      }
    };

    fetchMasterData();

    return () => {
      ignore = true;
    };
  }, []);

  return {
    cancelReasonsList,
    paymentGateways,
    initialCancelReasonId,
    initialPaymentMethod
  };
}
