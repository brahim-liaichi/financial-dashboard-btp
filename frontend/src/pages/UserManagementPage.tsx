// src/pages/UserManagementPage.tsx
import React from 'react';
import { UserList } from '@/features/user-management/components/UserList';

const UserManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h1>
      <UserList />
    </div>
  );
};

export default UserManagementPage;