import { Loader2 } from "lucide-react";

interface ToolInvocationProps {
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    args: any;
    state: string;
    result?: any;
  };
}

const TOOL_OPERATIONS = {
  str_replace_editor: {
    create: 'Creating',
    str_replace: 'Editing', 
    insert: 'Adding to',
    view: 'Reading',
    undo_edit: 'Reverting'
  },
  file_manager: {
    rename: 'Renaming',
    delete: 'Deleting'
  }
} as const;

function getFileName(path: string): string {
  if (!path) return '';
  return path.split('/').pop() || path;
}

function generateToolMessage(toolName: string, args: any): string {
  const fileName = getFileName(args?.path || '');
  
  if (toolName === 'str_replace_editor') {
    const command = args?.command;
    const operation = TOOL_OPERATIONS.str_replace_editor[command as keyof typeof TOOL_OPERATIONS.str_replace_editor];
    
    if (operation && fileName) {
      return `${operation} ${fileName}`;
    }
    
    if (operation) {
      return `${operation} file`;
    }
    
    return fileName ? `Working on ${fileName}` : 'Processing file';
  }
  
  if (toolName === 'file_manager') {
    const command = args?.command;
    const operation = TOOL_OPERATIONS.file_manager[command as keyof typeof TOOL_OPERATIONS.file_manager];
    
    if (command === 'rename' && fileName && args?.new_path) {
      const newFileName = getFileName(args.new_path);
      return `Renaming ${fileName} to ${newFileName}`;
    }
    
    if (operation && fileName) {
      return `${operation} ${fileName}`;
    }
    
    if (operation) {
      return `${operation} file`;
    }
    
    return fileName ? `Managing ${fileName}` : 'Managing file';
  }
  
  // Fallback: try to make any tool name more readable
  const readableName = toolName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, l => l.toUpperCase());
    
  return fileName ? `${readableName} - ${fileName}` : readableName;
}

export function ToolInvocation({ toolInvocation }: ToolInvocationProps) {
  const message = generateToolMessage(toolInvocation.toolName, toolInvocation.args);
  const isCompleted = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isCompleted ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}