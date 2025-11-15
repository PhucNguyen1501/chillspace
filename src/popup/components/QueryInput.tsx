import { Send, Lightbulb, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ApiSchema, GeneratedApiCall } from '../../types';
import { convertNaturalLanguageToApi, validateApiCall, getQuerySuggestions } from '../../lib/nlp';

interface Props {
  schema: ApiSchema | null;
  onQueryGenerated: (query: GeneratedApiCall) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function QueryInput({ schema, onQueryGenerated, loading, setLoading }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Load suggestions when schema changes
  useEffect(() => {
    if (schema) {
      const newSuggestions = getQuerySuggestions(schema);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [schema]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schema) {
      setError('Please select an API schema first');
      return;
    }

    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setError(null);
    setLoading(true);
    setShowSuggestions(false);

    try {
      const generatedQuery = await convertNaturalLanguageToApi(query.trim(), schema);
      
      // Validate the generated query
      setIsValidating(true);
      const isValid = validateApiCall(generatedQuery, schema);
      
      if (!isValid) {
        setError('Generated query may not match the API schema. Please review before executing.');
      }
      
      onQueryGenerated(generatedQuery);
      setQuery(''); // Clear input after successful generation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate query');
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  const exampleQueries = [
    "Get all users",
    "Create a new user",
    "Update user profile",
    "Delete user by ID",
    "Search for products",
    "Get order details"
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Natural Language Query
        </label>
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
              if (e.target.value.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onFocus={() => {
              if (query.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow click events
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="Describe what you want to do with the API..."
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm resize-none h-20"
            disabled={loading || !schema}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Example queries */}
      {!query && !loading && schema && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Try these examples:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.slice(0, 4).map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs hover:bg-muted/80"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={loading || !schema || !query.trim()}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isValidating ? 'Validating...' : 'Generating...'}</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Generate API Call</span>
          </>
        )}
      </button>

      {/* Schema info */}
      {schema && (
        <div className="p-3 bg-muted/50 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Selected Schema</span>
            <span className="text-xs text-muted-foreground">
              {schema.endpoints.length} endpoints
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{schema.title}</p>
          <p className="text-xs text-muted-foreground truncate">{schema.url}</p>
        </div>
      )}
    </div>
  );
}
