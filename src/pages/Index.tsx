import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, FileText, Lock, Folder, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };
    
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-primary to-accent rounded-lg w-10 h-10 flex items-center justify-center">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">Voice Notes</span>
        </div>
        
        <Button onClick={() => navigate('/auth')} variant="outline">
          Get Started
        </Button>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            🎤 Voice-Powered Note Taking
          </Badge>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Transform Your Voice into Organized Notes
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, organize, and secure your notes with the power of voice recognition. 
            No more typing - just speak and watch your thoughts come to life.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-12">
            <Button size="lg" onClick={() => navigate('/auth')} className="h-14 px-8 text-lg">
              Start Taking Notes
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
          <div className="text-center p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Voice Recognition</h3>
            <p className="text-muted-foreground">
              Real-time speech-to-text conversion with high accuracy. 
              Just speak naturally and watch your words appear.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-accent/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Folder className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Organization</h3>
            <p className="text-muted-foreground">
              Organize notes in folders, add tags, and use powerful search 
              to find exactly what you need.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-success/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Lock className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-muted-foreground">
              Encrypt sensitive notes with password protection. 
              Your data stays secure and private.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 p-8 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join thousands of users who are already taking notes with their voice. 
            Sign up today and experience the future of note-taking.
          </p>
          
          <Button size="lg" onClick={() => navigate('/auth')} className="h-12 px-8">
            Create Your Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
