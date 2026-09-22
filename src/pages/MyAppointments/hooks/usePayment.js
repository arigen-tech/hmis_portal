import { useState } from 'react';
import { apiService } from '../../../services/apiService';
import { ENDPOINTS } from '../../../constants/apiEndpoints';
import { loadRazorpayScript } from '../../../utils/loadRazorpay';
import { PAYMENT_CONFIG, PAYMENT_MODE } from '../../../constants';

export function usePayment({ patientDetails, showToast, closeModal, onPaymentSuccess }) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_MODE.ONLINE);

  const handleProcessPayment = async (selectedAppointment) => {
    if (!selectedAppointment) return;
    const displayName = selectedAppointment.testName || selectedAppointment.doctor;
    const { type, billHdId, amount, id } = selectedAppointment;

    // Handle non-lab/rad types (OPD mock)
    if (type !== 'lab' && type !== 'radiology') {
      onPaymentSuccess(id, type);
      closeModal();
      showToast(`Payment of ₹${amount.toLocaleString()} successful for ${displayName}!`);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const patientId = patientDetails?.patientId;

      if (!patientId || !billHdId) {
        showToast("Missing patient or billing details.", "error");
        setIsProcessingPayment(false);
        return;
      }

      const config = PAYMENT_CONFIG[type];
      if (!config) {
        showToast("Invalid appointment type for payment.", "error");
        setIsProcessingPayment(false);
        return;
      }

      if (paymentMethod === PAYMENT_MODE.CASH) {
        const finalPayload = {
          billingType: config.billingType,
          billHeaderId: billHdId,
          amount: amount,
          mode: "cash",
          investigationandPackegBillStatus: [],
          isPaymentUpdate: true,
          shouldNotCreateNewBilling: true,
          useExistingBillingHeader: true,
          patientId: patientId,
          paymentReferenceNo: `PAY${Date.now()}`,
          timestamp: new Date().toISOString(),
          operationType: "payment_update_only",
          ...config.buildExtraPayload(billHdId)
        };

        await apiService.post(config.endpoint, finalPayload);
        onPaymentSuccess(id, type);
        closeModal();
        showToast(`Cash payment of ₹${amount.toLocaleString()} successful!`);
        setIsProcessingPayment(false);
        return;
      }

      // Online / Razorpay flow
      const createOrderPayload = {
        billingItems: [{ billingHdId: billHdId, amount: amount }],
        billingType: config.billingType,
        patientId: patientId
      };
      
      const orderRes = await apiService.post(ENDPOINTS.PAYMENTS.CREATE_ORDER, createOrderPayload);
      if (!orderRes || !orderRes.orderId) {
        showToast("Failed to create Razorpay order.", "error");
        setIsProcessingPayment(false);
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast("Razorpay SDK failed to load. Are you online?", "error");
        setIsProcessingPayment(false);
        return;
      }

      let prefill = {};
      try {
        const prefillRes = await apiService.get(`${ENDPOINTS.PAYMENTS.RAZORPAY_PREFILL}/${patientId}`);
        if (prefillRes && prefillRes.response) {
          prefill = {
            name: prefillRes.response.patientFullName || "",
            email: prefillRes.response.email || "",
            contact: prefillRes.response.phoneNumber || ""
          };
        }
      } catch(e) {
        console.error("Failed to fetch prefill", e);
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere",
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "ARI Hospital",
        description: `Payment for ${displayName}`,
        order_id: orderRes.orderId,
        prefill: prefill,
        handler: async function (response) {
          try {
            const verifyPayload = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            };
            const verifyRes = await apiService.post(ENDPOINTS.PAYMENTS.VERIFY, verifyPayload);

            if (verifyRes && verifyRes.status === "success") {
              const paymentId = orderRes.paymentIds[0];
              let isPaid = false;
              for (let i = 0; i < 10; i++) {
                try {
                  const statusRes = await apiService.get(`${ENDPOINTS.PAYMENTS.STATUS}/${paymentId}`);
                  if (statusRes && statusRes.paymentStatus === "PAID") {
                    isPaid = true;
                    break;
                  }
                } catch (e) {
                  console.error("Status polling error", e);
                }
                await new Promise(r => setTimeout(r, 3000));
              }

              if (!isPaid) {
                showToast("Payment verification timed out. Please check later.", "error");
                setIsProcessingPayment(false);
                return;
              }

              const finalPayload = {
                billingType: config.billingType,
                billHeaderId: billHdId,
                amount: amount,
                mode: "online",
                investigationandPackegBillStatus: [],
                isPaymentUpdate: true,
                shouldNotCreateNewBilling: true,
                useExistingBillingHeader: true,
                patientId: patientId,
                paymentReferenceNo: response.razorpay_payment_id,
                timestamp: new Date().toISOString(),
                operationType: "payment_update_only",
                ...config.buildExtraPayload(billHdId)
              };

              await apiService.post(config.endpoint, finalPayload);
              onPaymentSuccess(id, type);
              closeModal();
              showToast(`Payment of ₹${amount.toLocaleString()} successful!`);
            } else {
              showToast("Payment verification failed.", "error");
            }
          } catch (err) {
            console.error(err);
            showToast("Error during payment verification.", "error");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        console.error("Payment failed", response.error);
        showToast(response.error.description || "Payment failed", "error");
        setIsProcessingPayment(false);
      });
      rzp1.open();
    } catch (err) {
      console.error(err);
      showToast("An error occurred while initiating payment.", "error");
      setIsProcessingPayment(false);
    }
  };

  return {
    isProcessingPayment,
    paymentMethod,
    setPaymentMethod,
    handleProcessPayment
  };
}
