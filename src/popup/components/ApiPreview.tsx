import { Play, Copy, Edit, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { GeneratedApiCall } from '../../types';

interface Props {
  query: GeneratedApiCall;
  onExecute: (query: GeneratedApiCall) => void;
  loading: boolean;
  onCreateJob?: (query: GeneratedApiCall) => void;
}

export default function ApiPreview({ query, onExecute, loading, onCreateJob }: Props) {
  const [editing, setEditing] = useState(false);
  const [editedQuery] = useState(query);
  const { user } = useAuth();

  // Heuristic: treat POST requests to a /graphql-style endpoint as GraphQL
  const isGraphQL =
    (editing ? editedQuery.method : query.method).toUpperCase() === 'POST' &&
    /graphql/i.test(editing ? editedQuery.endpoint : query.endpoint);

  const effectiveQuery = editing ? editedQuery : query;

  const graphqlSampleBody = {
    query:
      typeof effectiveQuery.body?.query === 'string'
        ? effectiveQuery.body.query
        : 'query ExampleQuery {\n  # Replace with your fields\n}',
    variables: effectiveQuery.body?.variables ?? {},
  };

  const handleCopy = () => {
    const baseHeaders = effectiveQuery.headers || {};
    const headers = isGraphQL
      ? {
          'Content-Type': 'application/json',
          ...baseHeaders,
        }
      : baseHeaders;

    const bodyForCopy = isGraphQL
      ? graphqlSampleBody
      : effectiveQuery.body;

    const code = `fetch('${effectiveQuery.endpoint}', {
  method: '${effectiveQuery.method}',
  headers: ${JSON.stringify(headers, null, 2)}${
    bodyForCopy ? `,\n  body: ${JSON.stringify(bodyForCopy, null, 2)}` : ''
  }
})`;
    navigator.clipboard.writeText(code);
  };

  const handleExecute = () => {
    onExecute(effectiveQuery);
  };

  const handleCreateJob = () => {
    if (onCreateJob) {
      onCreateJob(effectiveQuery);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Generated API Call</h3>
        <div className="flex gap-2">
          {user && onCreateJob && (
            <button
              onClick={handleCreateJob}
              className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
              title="Schedule as job"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {query.description && (
        <p className="text-xs text-gray-600">{query.description}</p>
      )}

      <div className="bg-primary-50 rounded-md p-3 space-y-2 text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary-600">{effectiveQuery.method}</span>
          <span className="text-gray-900">{effectiveQuery.endpoint}</span>
          {isGraphQL && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700">
              GraphQL
            </span>
          )}
        </div>

        {Object.keys(effectiveQuery.headers || {}).length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Headers:</p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(effectiveQuery.headers, null, 2)}
            </pre>
          </div>
        )}

        {effectiveQuery.queryParams && Object.keys(effectiveQuery.queryParams).length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Query Params:</p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(effectiveQuery.queryParams, null, 2)}
            </pre>
          </div>
        )}

        {(effectiveQuery.body || isGraphQL) && (
          <div>
            <p className="text-xs text-gray-600 mb-1">
              {isGraphQL ? 'GraphQL Body (query & variables):' : 'Body:'}
            </p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(isGraphQL ? graphqlSampleBody : effectiveQuery.body, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <button
        onClick={handleExecute}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded-md transition-colors"
      >
        <Play className="w-4 h-4" />
        {loading ? 'Executing...' : 'Execute Query'}
      </button>
    </div>
  );
}
