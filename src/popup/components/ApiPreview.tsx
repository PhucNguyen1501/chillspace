import { Play, Copy, Edit } from 'lucide-react';
import { useState } from 'react';
import type { GeneratedApiCall } from '../../types';

interface Props {
  query: GeneratedApiCall;
  onExecute: (query: GeneratedApiCall) => void;
  loading: boolean;
}

export default function ApiPreview({ query, onExecute, loading }: Props) {
  const [editing, setEditing] = useState(false);
  const [editedQuery] = useState(query);

  const handleCopy = () => {
    const code = `fetch('${query.endpoint}', {
  method: '${query.method}',
  headers: ${JSON.stringify(query.headers, null, 2)}${
    query.body ? `,\n  body: ${JSON.stringify(query.body, null, 2)}` : ''
  }
})`;
    navigator.clipboard.writeText(code);
  };

  const handleExecute = () => {
    onExecute(editing ? editedQuery : query);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Generated API Call</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {query.description && (
        <p className="text-xs text-muted-foreground">{query.description}</p>
      )}

      <div className="bg-accent/30 rounded-md p-3 space-y-2 text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">{query.method}</span>
          <span className="text-foreground">{query.endpoint}</span>
        </div>

        {Object.keys(query.headers).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Headers:</p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(query.headers, null, 2)}
            </pre>
          </div>
        )}

        {query.queryParams && Object.keys(query.queryParams).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Query Params:</p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(query.queryParams, null, 2)}
            </pre>
          </div>
        )}

        {query.body && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Body:</p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(query.body, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <button
        onClick={handleExecute}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        <Play className="w-4 h-4" />
        {loading ? 'Executing...' : 'Execute Query'}
      </button>
    </div>
  );
}
