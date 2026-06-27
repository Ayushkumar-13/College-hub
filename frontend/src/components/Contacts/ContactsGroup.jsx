import React from 'react';
import ContactCard from './ContactCard';
import { getContactId } from '@/utils/contactHelpers';

const ContactsGroup = ({ role, users, openModal, onMessageClick, currentUserId }) => {
  if (!users?.length) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-text-main">
        {role}{' '}
        <span className="font-medium text-text-dim">({users.length})</span>
      </h3>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => (
          <ContactCard
            key={getContactId(u)}
            user={u}
            openModal={openModal}
            onMessageClick={onMessageClick}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </section>
  );
};

export default ContactsGroup;
