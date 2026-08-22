// RegistrationInspectModal — Full-Screen Overlay Wrapper (2026 Edition)
import React from 'react';
import RegistrationDetailPage from '../../pages/RegistrationDetailPage';

const RegistrationInspectModal = ({ attendee, open, onClose, onUpdate }) => {
  if (!open || !attendee) return null;

  return (
    <RegistrationDetailPage
      attendeeId={attendee.id}
      isOverlay={true}
      onClose={onClose}
    />
  );
};

export default RegistrationInspectModal;
