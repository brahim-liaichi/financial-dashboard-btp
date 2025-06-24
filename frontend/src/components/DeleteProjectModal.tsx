import React, { useState, useMemo, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Project } from '@/types';

interface DeleteProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (projectCode: string) => void;
    projects: Project[];
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    projects
}) => {
    const [selectedProject, setSelectedProject] = useState<string>('');

    // Memoized project options to prevent unnecessary rerenders
    const projectOptions = useMemo(() => [
        { value: '', label: 'Select a project' },
        ...Array.from(
            new Map(projects.map(p => [p.code, p]))
            .values()
        )
        .map(p => ({ 
            value: p.code, 
            label: `${p.code} - ${p.name}` 
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    ], [projects]);

    // Memoized confirm handler
    const handleConfirm = useCallback(() => {
        if (selectedProject) {
            onConfirm(selectedProject);
            // Optional: Reset selection after confirmation
            setSelectedProject('');
        }
    }, [selectedProject, onConfirm]);

    // Memoized change handler
    const handleProjectChange = useCallback((value: string) => {
        setSelectedProject(value);
    }, []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Project">
            <div className="space-y-4">
                <p>Select a project to delete all its associated orders:</p>
                <Select
                    options={projectOptions}
                    value={selectedProject}
                    onChange={handleProjectChange}
                />
                <div className="flex justify-end space-x-2">
                    <Button 
                        variant="secondary" 
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleConfirm} 
                        disabled={!selectedProject}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </Modal>
    );
};