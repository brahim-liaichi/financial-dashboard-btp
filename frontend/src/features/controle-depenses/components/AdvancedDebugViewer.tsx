/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState} from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Copy, AlertTriangle, FileCode, Database, Shuffle, Network } from 'lucide-react';


interface AdvancedDebugViewerProps {
    debugEntries?: DebugEntry[];
    isLoading?: boolean;
    onClearEntries?: () => void;
}

// Enhanced Debug Entry Type
interface DebugEntry {
  timestamp: string;
  component: string;
  action: string;
  layer?: 'API' | 'Hook' | 'Component' | 'Service';
  inputData?: any;
  outputData?: any;
  rawResponse?: any;
  requestConfig?: any;
  transformations?: Array<{
    description: string;
    before: any;
    after: any;
  }>;
  metrics?: Record<string, number | string>;
  warnings?: string[];
  errors?: string[];
  status?: 'success' | 'error' | 'pending';
}

interface AdvancedDebugViewerProps {
  debugEntries?: DebugEntry[];
  isLoading?: boolean;
  onClearEntries?: () => void;
}

const AdvancedDebugViewer: React.FC<AdvancedDebugViewerProps> = ({
  debugEntries = [],
  isLoading = false,
  onClearEntries
}) => {
  const [activeView, setActiveView] = useState<'summary' | 'details' | 'anomalies' | 'layers'>('summary');
  const [selectedEntry, setSelectedEntry] = useState<DebugEntry | null>(null);

  // Utility to copy content to clipboard
  const copyToClipboard = (content: any) => {
    navigator.clipboard.writeText(
      typeof content === 'object' 
        ? JSON.stringify(content, null, 2) 
        : String(content)
    );
  };

  // Render Layer-Specific View
  const renderLayerBreakdown = () => {
    const layerGroups = debugEntries.reduce((acc, entry) => {
      const layer = entry.layer || 'Unspecified';
      if (!acc[layer]) acc[layer] = [];
      acc[layer].push(entry);
      return acc;
    }, {} as Record<string, DebugEntry[]>);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Layer Interaction Breakdown</h3>
        {Object.entries(layerGroups).map(([layer, entries]) => (
          <div key={layer} className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-700">{layer} Layer</h4>
              <span className="text-sm text-gray-500">{entries.length} entries</span>
            </div>
            {entries.map((entry, index) => (
              <div 
                key={index} 
                className={`p-2 mb-2 rounded ${
                  entry.status === 'error' ? 'bg-red-100' : 
                  entry.status === 'success' ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <div className="flex justify-between">
                  <span>{entry.component} - {entry.action}</span>
                  <span className="text-xs text-gray-500">{entry.timestamp}</span>
                </div>
                {entry.errors && (
                  <div className="text-red-600 text-sm mt-1">
                    {entry.errors.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };
  // Detect potential anomalies
  const detectAnomalies = (entries: DebugEntry[]) => {
    const anomalies: any[] = [];

    entries.forEach(entry => {
      // Check for unexpected null or undefined values
      if (entry.outputData === null || entry.outputData === undefined) {
        anomalies.push({
          type: 'Null Output',
          component: entry.component,
          timestamp: entry.timestamp
        });
      }

      // Check for extreme value changes
      if (entry.transformations) {
        entry.transformations.forEach(transform => {
          const beforeValue = typeof transform.before === 'number' ? transform.before : 0;
          const afterValue = typeof transform.after === 'number' ? transform.after : 0;
          
          // Flag significant changes (e.g., 10x increase/decrease)
          if (Math.abs(afterValue / (beforeValue || 1)) > 10) {
            anomalies.push({
              type: 'Extreme Value Change',
              component: entry.component,
              transformation: transform.description,
              before: transform.before,
              after: transform.after,
              timestamp: entry.timestamp
            });
          }
        });
      }

      // Collect warnings and errors
      if (entry.warnings && entry.warnings.length) {
        anomalies.push({
          type: 'Warning',
          component: entry.component,
          warnings: entry.warnings,
          timestamp: entry.timestamp
        });
      }

      if (entry.errors && entry.errors.length) {
        anomalies.push({
          type: 'Error',
          component: entry.component,
          errors: entry.errors,
          timestamp: entry.timestamp
        });
      }
    });

    return anomalies;
  };

  // Render individual debug entry details
  const renderEntryDetails = (entry: DebugEntry) => (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">
          {entry.component} - {entry.action}
        </h3>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => copyToClipboard(entry)}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy Entry
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Input Data</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(entry.inputData, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="font-semibold">Output Data</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(entry.outputData, null, 2)}
          </pre>
        </div>
      </div>

      {entry.transformations && (
        <div>
          <h4 className="font-semibold">Transformations</h4>
          {entry.transformations.map((transform, index) => (
            <div key={index} className="bg-white p-2 rounded mb-2">
              <p className="font-medium">{transform.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <small>Before:</small>
                  <pre className="text-xs">{JSON.stringify(transform.before, null, 2)}</pre>
                </div>
                <div>
                  <small>After:</small>
                  <pre className="text-xs">{JSON.stringify(transform.after, null, 2)}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(entry.warnings || entry.errors) && (
        <div className="bg-red-50 p-2 rounded">
          {entry.warnings && (
            <div>
              <h4 className="font-semibold text-yellow-600">Warnings</h4>
              {entry.warnings.map((warning, index) => (
                <p key={index} className="text-yellow-700">{warning}</p>
              ))}
            </div>
          )}
          {entry.errors && (
            <div>
              <h4 className="font-semibold text-red-600">Errors</h4>
              {entry.errors.map((error, index) => (
                <p key={index} className="text-red-700">{error}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {entry.metrics && (
        <div>
          <h4 className="font-semibold">Metrics</h4>
          <ul className="bg-white p-2 rounded">
            {Object.entries(entry.metrics).map(([key, value]) => (
              <li key={key} className="text-sm">
                {key}: {value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Anomalies view
  const renderAnomalies = () => {
    const anomalies = detectAnomalies(debugEntries);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center bg-yellow-50 p-4 rounded">
          <AlertTriangle className="mr-4 text-yellow-600" />
          <h3 className="text-lg font-bold text-yellow-700">
            {anomalies.length} Potential Anomalies Detected
          </h3>
        </div>
        
        {anomalies.map((anomaly, index) => (
          <div 
            key={index} 
            className={`p-3 rounded ${
              anomaly.type === 'Error' ? 'bg-red-50 border-red-200' : 
              anomaly.type === 'Warning' ? 'bg-yellow-50 border-yellow-200' : 
              'bg-blue-50 border-blue-200'
            } border`}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">{anomaly.type}</h4>
              <span className="text-sm text-gray-500">{anomaly.timestamp}</span>
            </div>
            <pre className="text-xs bg-white p-2 rounded">
              {JSON.stringify(anomaly, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    );
  };

  // Summary view
  const renderSummary = () => {
    const componentCounts = debugEntries.reduce((acc, entry) => {
      acc[entry.component] = (acc[entry.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <FileCode className="mr-2" />
              <h4 className="font-semibold">Total Entries</h4>
            </div>
            <p className="text-2xl font-bold">{debugEntries.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Shuffle className="mr-2" />
              <h4 className="font-semibold">Components Involved</h4>
            </div>
            <p className="text-2xl font-bold">{Object.keys(componentCounts).length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Database className="mr-2" />
              <h4 className="font-semibold">Unique Actions</h4>
            </div>
            <p className="text-2xl font-bold">
              {new Set(debugEntries.map(entry => entry.action)).size}
            </p>
          </Card>
        </div>

        <div>
          <h3 className="font-bold mb-2">Component Interaction Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(componentCounts).map(([component, count]) => (
              <div 
                key={component} 
                className="bg-gray-50 p-3 rounded flex justify-between items-center"
              >
                <span>{component}</span>
                <span className="font-bold">{count} entries</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center border-b mb-4">
        <div className="flex space-x-4">
          {[
            { value: 'summary', label: 'Summary', icon: <Database className="mr-2 h-4 w-4" /> },
            { value: 'layers', label: 'Layer View', icon: <Network className="mr-2 h-4 w-4" /> },
            { value: 'details', label: 'Detailed Logs', icon: <FileCode className="mr-2 h-4 w-4" /> },
            { value: 'anomalies', label: 'Anomalies', icon: <AlertTriangle className="mr-2 h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.value}
              className={`flex items-center px-4 py-2 border-b-2 ${
                activeView === tab.value 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveView(tab.value as any)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        {onClearEntries && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClearEntries}
          >
            Clear Entries
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading debug information...</div>
      ) : (
        <>
          {activeView === 'summary' && renderSummary()}
          {activeView === 'layers' && renderLayerBreakdown()}
          {activeView === 'anomalies' && renderAnomalies()}
          {activeView === 'details' && (
            <div className="space-y-4">
              {debugEntries.map((entry, index) => (
                <div 
                  key={index} 
                  onClick={() => setSelectedEntry(entry)}
                  className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                    entry.status === 'error' ? 'bg-red-100 hover:bg-red-200' :
                    entry.status === 'success' ? 'bg-green-100 hover:bg-green-200' :
                    'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span>{entry.component} - {entry.action}</span>
                  <div className="flex items-center space-x-2">
                    {entry.layer && (
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {entry.layer}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{entry.timestamp}</span>
                  </div>
                </div>
              ))}
              {selectedEntry && (
                <div className="mt-4">
                  {renderEntryDetails(selectedEntry)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default AdvancedDebugViewer;