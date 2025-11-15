import { CheckCircle, XCircle, Download } from 'lucide-react';
import type { MessageResponse } from '../../types';

interface Props {
  response: MessageResponse;
}

export default function ResponseViewer({ response }: Props) {
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {response.success ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <h3 className="text-sm font-semibold">
            {response.success ? 'Success' : 'Error'}
          </h3>
        </div>
        {response.success && response.data && (
          <button
            onClick={handleDownload}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {response.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
          <p className="text-sm text-red-600 dark:text-red-400">
            {response.error}
          </p>
        </div>
      )}

      {response.success && response.data && (
        <div className="bg-accent/30 rounded-md p-3 space-y-2">
          {response.data.status && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-semibold ${
                response.data.status < 400 ? 'text-green-500' : 'text-red-500'
              }`}>
                {response.data.status} {response.data.statusText}
              </span>
            </div>
          )}

          {response.data.headers && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Response Headers
              </summary>
              <pre className="mt-2 text-xs overflow-x-auto font-mono">
                {JSON.stringify(response.data.headers, null, 2)}
              </pre>
            </details>
          )}

          {response.data.body && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Response Body:</p>
              <pre className="text-xs overflow-x-auto max-h-64 font-mono bg-background p-2 rounded border border-border">
                {typeof response.data.body === 'string'
                  ? response.data.body
                  : JSON.stringify(response.data.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
