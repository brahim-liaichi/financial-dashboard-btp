import React, { useMemo, useCallback, memo, useEffect } from 'react';
import { Table, TableColumn } from '@/components/ui/Table';
import type { Commande, Project } from '@/types';
import { formatDate, formatCurrency } from '@/utils/formatters';

interface CommandeTableProps {
  commandes: Commande[];
  loading: boolean;
  projects: Project[];
  onRowClick?: (commande: Commande) => void;
}

// Extend CommandeRecord with stronger typing
type CommandeRecord = Pick<Commande, 
  'numero_document' |
  'code_projet' |
  'date_enregistrement' |
  'statut_document' |
  'nom_fournisseur' |
  'numero_article' |
  'description_article' |
  'total_lignes' |
  'devise_prix'
>;

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'O':
      return 'text-red-500 font-semibold';
    case 'C':
      return 'text-green-500 font-semibold';
    default:
      return 'text-gray-500 font-normal';
  }
};

const CommandeTableComponent: React.FC<CommandeTableProps> = ({ 
  commandes, 
  loading,
  projects,
  onRowClick
}) => {
  // Performance logging (can be removed in production)
  useEffect(() => {
    console.log('CommandeTable rendered', {
      commandesLength: commandes.length,
      projectsLength: projects.length,
      loading
    });
  }, [commandes, projects, loading]);
  // Create projects map for efficient lookups
  const projectsMap = useMemo(() => {
    const map: Record<string, Project> = {};
    for (const project of projects) {
      map[project.code] = project;
    }
    return map;
  }, [projects]);

  // Memoized columns with stable references
  const columns = useMemo<TableColumn<CommandeRecord>[]>(() => [
    { 
      key: 'numero_document', 
      title: 'N° Document', 
      width: '10%',
      sortable: true,
      render: (item) => item.numero_document
    },
    { 
      key: 'numero_article', 
      title: 'N° Article', 
      width: '10%',
      sortable: true,
      render: (item) => item.numero_article
    },
    { 
      key: 'description_article', 
      title: 'Description', 
      width: '20%',
      sortable: true,
      render: (item) => item.description_article
    },
    { 
      key: 'code_projet', 
      title: 'Projet', 
      width: '10%',
      sortable: true,
      render: (item) => {
        const project = projectsMap[item.code_projet];
        return project ? `${project.code} - ${project.name}` : item.code_projet;
      }
    },
    { 
      key: 'date_enregistrement', 
      title: 'Date Enregistrement', 
      width: '10%',
      sortable: true,
      render: (item) => formatDate(item.date_enregistrement)
    },
    { 
      key: 'statut_document', 
      title: 'Statut', 
      width: '10%',
      sortable: true,
      render: (item) => (
        <span className={getStatusColor(item.statut_document)}>
          {item.statut_document === 'O' ? 'Ouvert' : 'Fermé'}
        </span>
      )
    },
    { 
      key: 'nom_fournisseur', 
      title: 'Fournisseur', 
      width: '15%',
      sortable: true,
      render: (item) => item.nom_fournisseur
    },
    { 
      key: 'total_lignes', 
      title: 'Total', 
      width: '10%',
      sortable: true,
      render: (item) => {
        const total = typeof item.total_lignes === 'number' 
          ? item.total_lignes 
          : parseFloat(String(item.total_lignes));
          
        return isNaN(total) 
          ? 'N/A' 
          : formatCurrency(total, item.devise_prix);
      }
    }
  ], [projectsMap]);

  // Memoized validated commandes with strict typing
  const validatedCommandes = useMemo(() => {
    return commandes.map(item => {
      // Use nullish coalescing and type coercion more efficiently
      return {
        numero_document: item.numero_document || '',
        code_projet: item.code_projet || '',
        date_enregistrement: item.date_enregistrement || '',
        statut_document: item.statut_document || '',
        nom_fournisseur: item.nom_fournisseur || '',
        numero_article: item.numero_article || '',
        description_article: item.description_article || '',
        total_lignes: Number(item.total_lignes) || 0,
        devise_prix: item.devise_prix || '',
      };
    });
  }, [commandes]);

  // Memoized row click handler
  const handleRowClick = useCallback((item: CommandeRecord) => {
    if (onRowClick) {
      const originalCommande = commandes.find(
        c => c.numero_document === item.numero_document
      );
      if (originalCommande) {
        onRowClick(originalCommande);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRowClick, commandes.length]);

  return (
    <div className="overflow-x-auto">
      <Table<CommandeRecord>
        columns={columns}
        data={validatedCommandes}
        loading={loading}
        emptyMessage="Aucune commande trouvée. Ajustez vos filtres ou importez de nouvelles données."
        onRowClick={onRowClick ? handleRowClick : undefined}
      />
    </div>
  );
};

// Memoized component with enhanced comparison
export const CommandeTable = memo(CommandeTableComponent, (prevProps, nextProps) => {
  // Check for reference equality first
  if (prevProps === nextProps) return true;

  // Strict comparison of critical props
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.commandes.length === nextProps.commandes.length &&
    prevProps.projects.length === nextProps.projects.length &&
    prevProps.commandes.every((comm, index) => 
      // Compare more unique identifiers
      comm.numero_document === nextProps.commandes[index].numero_document &&
      comm.code_projet === nextProps.commandes[index].code_projet
    )
  );
});