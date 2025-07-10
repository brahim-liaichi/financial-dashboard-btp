import React, { useMemo, useState, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { getProjectName, getAllProjects } from '@/constants/projects';
import { userApi } from '@/api/endpoints/users';

interface ControleFiltersProps {
   projects?: string[];
   selectedProject?: string;
   onProjectChange?: (project: string) => void;
   onReset?: () => void;
}

export const ControleFilters: React.FC<ControleFiltersProps> = ({
   projects = [],
   selectedProject = '',
   onProjectChange,
   onReset
}): JSX.Element => {
   const [projectUsers, setProjectUsers] = useState<{ value: string; label: string }[]>([
       { value: '', label: 'Tous les utilisateurs' }
   ]);
   const [selectedUser, setSelectedUser] = useState<string>('');
   const projectsWithTypes = useMemo(() => getAllProjects(), []);

   const projectOptions = useMemo(() => {
       const baseOptions = [{ value: '', label: 'Tous les projets' }];

       const projectOptions = projects.map(code => {
           const project = projectsWithTypes.find(p => p.code === code);
           const typeLabel = project?.type === 'METRE' ? 'Métré' : 'Forfait';
           return {
               value: code,
               label: `${code} - ${getProjectName(code)} (${typeLabel})`,
               type: project?.type || ''
           };
       });

       return [...baseOptions, ...projectOptions];
   }, [projects, projectsWithTypes]);

   // Fetch users when project changes
   useEffect(() => {
       const fetchProjectUsers = async () => {
           if (selectedProject) {
               try {
                   const response = await userApi.getProjectMembers(selectedProject);
                   
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   const userOptions = response.data?.map((membership: any, index: number) => ({
                       value: membership.user?.toString() ?? `unknown-${index}`,
                       label: membership.username ?? `Unknown User ${index}`
                   })) ?? [];

                   const fullUserOptions = [
                       { value: '', label: 'Tous les utilisateurs' },
                       ...userOptions
                   ];

                   setProjectUsers(fullUserOptions);
                   
                   // Reset selected user when project changes
                   setSelectedUser('');
               } catch (error) {
                   console.error('Error fetching project users', error);
                   setProjectUsers([{ value: '', label: 'Tous les utilisateurs' }]);
               }
           } else {
               setProjectUsers([{ value: '', label: 'Tous les utilisateurs' }]);
           }
       };

       fetchProjectUsers();
   }, [selectedProject]);

   const handleProjectChange = (value: string) => {
       onProjectChange?.(value);
   };

   const handleUserChange = (value: string) => {
       setSelectedUser(value);
       // Add any additional logic for user selection if needed
       
   };

   const handleReset = () => {
       onProjectChange?.('');
       setSelectedUser('');
       onReset?.();
   };

   return (
       <div className="bg-white rounded-lg shadow">
           <div className="p-4">
               <div className="flex items-center justify-between space-x-4">
                   <div className="flex items-center space-x-2 flex-grow max-w-xl">
                       <Select
                           label="Filtrer par Projet"
                           options={projectOptions}
                           value={selectedProject}
                           onChange={handleProjectChange}
                           className="flex-grow"
                       />
                       {selectedProject && (
                           <Select
                               label="Utilisateurs du Projet"
                               options={projectUsers}
                               value={selectedUser}
                               onChange={handleUserChange}
                               className="flex-grow"
                               placeholder="Sélectionner un utilisateur"
                           />
                       )}
                   </div>

                   <Button
                       variant="secondary"
                       onClick={handleReset}
                       className="self-end"
                       disabled={!selectedProject}
                   >
                       Réinitialiser
                   </Button>
               </div>
           </div>
       </div>
   );
};