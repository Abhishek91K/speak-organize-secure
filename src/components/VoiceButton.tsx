import { useState, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onRecordingChange: (isRecording: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}

export const VoiceButton = ({ 
  onTranscript, 
  onRecordingChange, 
  isDisabled = false,
  className 
}: VoiceButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };
      
      recognitionInstance.onstart = () => {
        setIsRecording(true);
        onRecordingChange(true);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
        onRecordingChange(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        onRecordingChange(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [onTranscript, onRecordingChange]);

  const toggleRecording = () => {
    if (!recognition) return;
    
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const buttonContent = () => {
    if (!isSupported) {
      return (
        <>
          <Mic className="h-5 w-5" />
          <span className="ml-2">Not Supported</span>
        </>
      );
    }
    
    if (isRecording) {
      return (
        <>
          <Square className="h-5 w-5" />
          <span className="ml-2">Stop Recording</span>
        </>
      );
    }
    
    return (
      <>
        <Mic className="h-5 w-5" />
        <span className="ml-2">Start Recording</span>
      </>
    );
  };

  return (
    <Button
      onClick={toggleRecording}
      disabled={isDisabled || !isSupported}
      className={cn(
        "relative transition-all duration-300 font-medium px-6 py-3",
        isRecording 
          ? "voice-button-recording" 
          : "voice-button-idle",
        className
      )}
      size="lg"
    >
      {buttonContent()}
    </Button>
  );
};

export default VoiceButton;