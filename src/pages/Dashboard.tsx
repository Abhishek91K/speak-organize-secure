import { useState, useEffect } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderSidebar } from "@/components/FolderSidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  tags: string[];
  is_encrypted: boolean;
  voice_duration: number;
  created_at: string;
  updated_at: string;
}

export const Dashboard = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getCurrentUser();
  }, []);

  const handleNoteSelect = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();
      
      if (error) throw error;
      
      setSelectedNote(data);
      setIsEditing(true);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast({
        title: "Error",
        description: "Failed to load note.",
        variant: "destructive",
      });
    }
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setIsEditing(true);
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      let result;
      
      if (selectedNote) {
        // Update existing note
        result = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', selectedNote.id)
          .select()
          .single();
      } else {
        // Create new note
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        result = await supabase
          .from('notes')
          .insert([{
            title: noteData.title || 'Untitled Note',
            content: noteData.content || '',
            tags: noteData.tags || [],
            is_encrypted: noteData.is_encrypted || false,
            voice_duration: noteData.voice_duration || 0,
            folder_id: selectedFolderId,
            user_id: user.id
          }])
          .select()
          .single();
      }
      
      if (result.error) throw result.error;
      
      setSelectedNote(result.data);
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Success",
        description: selectedNote ? "Note updated successfully." : "Note created successfully.",
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save note.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we load your notes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <FolderSidebar
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        onNoteSelect={handleNoteSelect}
        onNewNote={handleNewNote}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Voice Notes</h1>
              <p className="text-sm text-muted-foreground">
                Create and organize your notes with voice-to-text
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {isEditing ? (
            <NoteEditor
              note={selectedNote}
              onSave={handleSaveNote}
              onClose={() => setIsEditing(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20">
              <div className="text-center max-w-md">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
                
                <h2 className="text-xl font-semibold mb-2">Welcome to Voice Notes</h2>
                <p className="text-muted-foreground mb-6">
                  Select a note from the sidebar or create a new one to get started with voice-powered note taking.
                </p>
                
                <Button onClick={handleNewNote} className="animate-scale-in">
                  Create Your First Note
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;