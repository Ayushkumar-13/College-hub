// FILE: src/components/contacts/ContactsGroup.jsx
import React from "react";
import ContactCard from "./ContactCard";

const ContactsGroup = ({ role, users, openModal, onMessageClick, currentUserId}) => {
  if (!users || users.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-text-main mb-4 transition-colors duration-300">
        {role} <span className="text-text-dim/60 font-medium">({users.length})</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <ContactCard
            key={u._id}
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
