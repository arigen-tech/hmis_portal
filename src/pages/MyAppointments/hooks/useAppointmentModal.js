import { useState, useCallback } from 'react';

export function useAppointmentModal() {
  const [modalType, setModalTypeState] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const openModal = useCallback((type, appointment = null) => {
    setSelectedAppointment(appointment);
    setModalTypeState(type);
  }, []);

  const closeModal = useCallback(() => {
    setModalTypeState(null);
    setSelectedAppointment(null);
  }, []);

  return {
    modalType,
    selectedAppointment,
    openModal,
    closeModal
  };
}
