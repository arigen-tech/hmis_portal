const decodeTokenPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const json = decodeURIComponent(
      Array.from(decoded, character =>
        `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`
      ).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getPatientIdentityFromToken = (token) => {
  const claims = decodeTokenPayload(token);
  if (!claims) return null;

  const subjectPatientId = typeof claims.sub === 'string'
    ? claims.sub.match(/^patient:(.+)$/i)?.[1]
    : null;
  const patientId = claims.patientId ?? claims.patient_id ?? subjectPatientId;
  const patientName = claims.name ?? claims.patientName;

  if (patientId == null && !patientName) return null;

  return {
    patientId: patientId ?? null,
    patientName: patientName ?? '',
    patientPhoneNumber: claims.mobileNo ?? claims.patientPhoneNumber ?? '',
  };
};

export const getPatientForToken = (token, patientList = [], fallbackPatientId = null) => {
  const identity = getPatientIdentityFromToken(token);
  if (!identity) {
    return patientList.find(patient =>
      fallbackPatientId != null &&
      String(patient.patientId ?? patient.id) === String(fallbackPatientId)
    ) || patientList[0] || null;
  }

  const matchedPatient = identity.patientId != null
    ? patientList.find(patient =>
      String(patient.patientId ?? patient.id) === String(identity.patientId)
    )
    : patientList.find(patient =>
      identity.patientName &&
      String(patient.patientName || '').trim().toLowerCase() === identity.patientName.trim().toLowerCase()
    );

  return matchedPatient || {
    ...identity,
    relation: '',
    gender: '',
    age: '',
    status: '',
  };
};
