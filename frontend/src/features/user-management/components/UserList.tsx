// src/features/user-management/components/UserList.tsx
import React, { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import apiClient from '@/api/client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User, TableColumn } from '@/types';

// Extend User to make it compatible with Record<string, unknown>
interface ExtendedUser extends Record<string, unknown> {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
    profile: {
        total_projects_created: number;
        total_project_value: number;
        last_login_at: string | null;
    };
}

export const UserList: React.FC = () => {
    const [users, setUsers] = useState<ExtendedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await apiClient.get<ExtendedUser[]>('/user-management/user-projects/');
                setUsers(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching users', error);
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const userColumns: TableColumn<ExtendedUser>[] = [
        {
            key: 'username',
            title: 'Nom d\'utilisateur',
            width: '200px'
        },
        {
            key: 'email',
            title: 'Email',
            width: '250px'
        },
        {
            key: 'total_projects',
            title: 'Projets Totaux',
            render: (user: ExtendedUser) => user.profile.total_projects_created.toString(),
            width: '150px'
        },
        {
            key: 'last_login',
            title: 'Dernière Connexion',
            render: (user: ExtendedUser) => 
                user.profile.last_login_at 
                    ? new Date(user.profile.last_login_at).toLocaleString() 
                    : 'Jamais',
            width: '200px'
        }
    ];

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Liste des Utilisateurs</h2>
                <Table
                    data={users}
                    columns={userColumns}
                    loading={loading}
                    emptyMessage="Aucun utilisateur trouvé"
                />
            </div>
        </Card>
    );
};