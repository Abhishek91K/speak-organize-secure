import { useState, useEffect, useRef } from "react";
import { Save, Lock, Unlock, Hash, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { VoiceButton } from "./VoiceButton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_encrypted: boolean;
  voice_duration: number;
}

interface NoteEditorProps {
  note?: Note | null;
  onSave: (noteData: Partial<Note>) => void;
  onClose: () => void;
}

const TAG_COLORS = ['blue', 'purple', 'green', 'orange', 'pink', 'yellow'];

export const NoteEditor = ({ note, onSave, onClose }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(note?.is_encrypted || false);
  const [isRecording, setIsRecording] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setHasUnsavedChanges(true);
  }, [content]);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [title, tags, isEncrypted]);

  const handleVoiceTranscript = (transcript: string) => {
    const cursorPosition = contentRef.current?.selectionStart || content.length;
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    
    // Add space if needed
    const separator = beforeCursor && !beforeCursor.endsWith(' ') && !beforeCursor.endsWith('\n') ? ' ' : '';
    const newContent = beforeCursor + separator + transcript + afterCursor;
    
    setContent(newContent);
    
    // Move cursor to end of new text
    setTimeout(() => {
      if (contentRef.current) {
        const newPosition = cursorPosition + separator.length + transcript.length;
        contentRef.current.selectionStart = newPosition;
        contentRef.current.selectionEnd = newPosition;
        contentRef.current.focus();
      }
    }, 0);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      title: title.trim(),
      content,
      tags,
      is_encrypted: isEncrypted,
    });
    
    setHasUnsavedChanges(false);
    toast({
      title: "Note Saved",
      description: "Your note has been saved successfully.",
    });
  };

  const getTagColor = (index: number) => {
    return TAG_COLORS[index % TAG_COLORS.length];
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card">
        <div className="flex items-center space-x-4 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-lg font-semibold border-none shadow-none p-0 h-auto bg-transparent focus-visible:ring-0"
          />
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="text-xs">
              Unsaved changes
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEncrypted(!isEncrypted)}
            className={cn(
              "transition-colors",
              isEncrypted ? "text-orange-600 hover:text-orange-700" : "text-muted-foreground"
            )}
          >
            {isEncrypted ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="ml-4"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Tags Section */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2 mb-3">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Tags</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, index) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`tag-${getTagColor(index)} cursor-pointer hover:opacity-80`}
              onClick={() => handleRemoveTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            className="max-w-xs"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button onClick={handleAddTag} variant="outline" size="sm">
            Add
          </Button>
        </div>
      </div>

      {/* Voice Recording Section */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              onRecordingChange={setIsRecording}
            />
            
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="voice-wave w-1 h-8"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground animate-pulse">
                  Listening...
                </span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {wordCount} words
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="flex-1 p-6">
        <Textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing or use voice recording to add content..."
          className="min-h-full resize-none border-none shadow-none p-0 text-base leading-relaxed focus-visible:ring-0 bg-transparent"
        />
      </div>
    </div>
  );
};

export default NoteEditor;