'use client';

import { useState } from 'react';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import AuditLogViewer from '../audit/AuditLogViewer';

interface Props {
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  compact?: boolean;
}

export default function ObjectAuditTrail({ resourceType, resourceId, resourceName, compact = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (compact) {
    return (
      <div className="border rounded-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">
              Audit Trail {resourceName && `- ${resourceName}`}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="border-t p-4">
            <AuditLogViewer 
              resourceType={resourceType} 
              resourceId={resourceId}
              showGlobal={false}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Audit Trail {resourceName && `- ${resourceName}`}
        </h2>
      </div>
      
      <AuditLogViewer 
        resourceType={resourceType} 
        resourceId={resourceId}
        showGlobal={false}
      />
    </div>
  );
}