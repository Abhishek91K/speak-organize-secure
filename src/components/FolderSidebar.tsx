import { useState, useEffect } from "react";
import { 
  Folder, 
  FolderPlus, 
  FileText, 
  Search,
  ChevronRight,
  ChevronDown,
  Mic,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  children?: Folder[];
}

interface Note {
  id: string;
  title: string;
  folder_id: string | null;
  tags: string[];
  is_encrypted: boolean;
  voice_duration: number;
  created_at: string;
}

interface FolderSidebarProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onNoteSelect: (noteId: string) => void;
  onNewNote: () => void;
  refreshTrigger: number;
}

export const FolderSidebar = ({ 
  selectedFolderId, 
  onFolderSelect, 
  onNoteSelect, 
  onNewNote,
  refreshTrigger 
}: FolderSidebarProps) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    fetchFolders();
    fetchNotes();
  }, [refreshTrigger]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Build folder tree
      const folderMap = new Map();
      const rootFolders: Folder[] = [];
      
      data?.forEach(folder => {
        folderMap.set(folder.id, { ...folder, children: [] });
      });
      
      data?.forEach(folder => {
        const folderWithChildren = folderMap.get(folder.id);
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children.push(folderWithChildren);
          }
        } else {
          rootFolders.push(folderWithChildren);
        }
      });
      
      setFolders(rootFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, folder_id, tags, is_encrypted, voice_duration, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('folders')
        .insert([{
          name: newFolderName.trim(),
          parent_id: selectedFolderId,
          color: 'blue',
          user_id: user.id
        }]);
      
      if (error) throw error;
      
      setNewFolderName("");
      setIsCreatingFolder(false);
      fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: Folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const folderNotes = notes.filter(note => note.folder_id === folder.id);
    
    return (
      <div key={folder.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
            isSelected && "bg-accent text-accent-foreground",
            "ml-" + (depth * 4)
          )}
          onClick={() => onFolderSelect(folder.id)}
        >
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-4 w-4 mr-2"
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(folder.id);
            }}
          >
            {folder.children && folder.children.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : null}
          </Button>
          
          <Folder className="h-4 w-4 mr-2 text-primary" />
          
          <span className="flex-1 text-sm">{folder.name}</span>
          
          {folderNotes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {folderNotes.length}
            </Badge>
          )}
        </div>
        
        {isExpanded && folder.children && (
          <div className="ml-4">
            {folder.children.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    return note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const getCurrentFolderNotes = () => {
    return filteredNotes.filter(note => note.folder_id === selectedFolderId);
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Voice Notes</h2>
          <Button
            onClick={onNewNote}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-sidebar-accent"
          />
        </div>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-sidebar-foreground">Folders</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingFolder(true)}
              className="h-6 w-6 p-0"
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
          
          {/* All Notes */}
          <div
            className={cn(
              "flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors hover:bg-sidebar-accent",
              selectedFolderId === null && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
            onClick={() => onFolderSelect(null)}
          >
            <FileText className="h-4 w-4 mr-2 text-sidebar-primary" />
            <span className="flex-1 text-sm">All Notes</span>
            <Badge variant="secondary" className="text-xs">
              {notes.length}
            </Badge>
          </div>
          
          {/* Folder Tree */}
          <div className="mt-2 space-y-1">
            {folders.map(folder => renderFolder(folder))}
          </div>
          
          {/* Create Folder Input */}
          {isCreatingFolder && (
            <div className="mt-2 px-3">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') createFolder();
                  if (e.key === 'Escape') setIsCreatingFolder(false);
                }}
                onBlur={createFolder}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Notes in Current Folder */}
        {(selectedFolderId !== null || searchQuery) && (
          <div className="border-t border-sidebar-border p-4">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Notes</h3>
            <div className="space-y-2">
              {getCurrentFolderNotes().map(note => (
                <div
                  key={note.id}
                  className="flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors hover:bg-sidebar-accent group"
                  onClick={() => onNoteSelect(note.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-3 w-3 text-sidebar-primary flex-shrink-0" />
                      {note.is_encrypted && (
                        <Lock className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      )}
                      <span className="text-sm truncate">{note.title}</span>
                    </div>
                    
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {note.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {getCurrentFolderNotes().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notes found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderSidebar;