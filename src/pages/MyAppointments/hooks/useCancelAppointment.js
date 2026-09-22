import { useState, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { ENDPOINTS, PAYMENT_STATUS, GATEWAY_CODE } from '../../../constants';

export function useCancelAppointment({ showToast, onRefresh }) {
  const [cancelReasonId, setCancelReasonId] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConfirmCancel = useCallback(async (selectedAppointment) => {
    if (!selectedAppointment) return;
    const displayName = selectedAppointment.testName || selectedAppointment.doctor;

    setIsCancelling(true);
    try {
      let paymentMode = GATEWAY_CODE.CASH;
      const refundAmt = selectedAppointment.paymentStatus === PAYMENT_STATUS.PAID ? (selectedAppointment.amount || 0) : 0;
      const isOnline = selectedAppointment.paymentGatewayModeName === "Online";

      if (isOnline) {
        paymentMode = GATEWAY_CODE.RAZORPAY;
      }

      // Step 1: Cancel the appointment FIRST to ensure system consistency.
      const cancelPayload = {
        visitId: selectedAppointment.id,
        cancelReasonId: cancelReasonId,
        paymentMode: paymentMode,
        refundAmount: refundAmt
      };

      const cancelResponse = await apiService.post(ENDPOINTS.APPOINTMENTS.CANCEL_APPOINTMENT, cancelPayload);
      
      if (cancelResponse && cancelResponse.status === 200) {
        // Step 2: Only initiate refund if cancellation was successful.
        if (isOnline && refundAmt > 0) {
          const refundPayload = {
            billingHeaderId: selectedAppointment.billHdId,
            refundAmount: refundAmt,
            refundReasonId: cancelReasonId
          };
          
          try {
            await apiService.post(ENDPOINTS.BILLING.REFUND, refundPayload);
            showToast(`Appointment for ${displayName} has been cancelled and refund initiated.`, 'info');
          } catch (refundError) {
            console.error("Refund failed:", refundError);
            // Show a clear error about partial failure
            showToast(`Appointment cancelled, but refund failed to initiate. Please contact support.`, "error");
          }
        } else {
          showToast(`Appointment for ${displayName} has been cancelled.`, 'info');
        }
        
        if (onRefresh) onRefresh();
        return true; // Success signal
      } else {
        showToast(cancelResponse?.message || "Failed to cancel appointment", "error");
        return false;
      }
    } catch (error) {
      console.error(error);
      showToast("An error occurred while cancelling.", "error");
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, [cancelReasonId, showToast, onRefresh]);

  return {
    cancelReasonId,
    setCancelReasonId,
    isCancelling,
    handleConfirmCancel
  };
}
