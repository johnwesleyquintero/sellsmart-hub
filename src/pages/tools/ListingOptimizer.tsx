
import React, { useState } from 'react';
import { FileText, Check, X, AlertTriangle, Loader2, Upload } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface OptimizationResult {
  score: number;
  title: {
    score: number;
    feedback: string[];
    suggestions: string[];
  };
  bullets: {
    score: number;
    feedback: string[];
    suggestions: string[];
  };
  description: {
    score: number;
    feedback: string[];
    suggestions: string[];
  };
}

const ListingOptimizer = () => {
  const [title, setTitle] = useState('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const { toast } = useToast();
  
  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const titleScore = Math.floor(Math.random() * 35) + 50;
      const bulletsScore = bulletPoints ? Math.floor(Math.random() * 40) + 60 : 0;
      const descriptionScore = description ? Math.floor(Math.random() * 40) + 60 : 0;
      
      const totalItems = 3;
      const itemsWithContent = [
        title ? 1 : 0,
        bulletPoints ? 1 : 0,
        description ? 1 : 0
      ].reduce((a, b) => a + b, 0);
      
      const totalScore = Math.floor(
        (titleScore + (bulletsScore || 0) + (descriptionScore || 0)) / itemsWithContent
      );
      
      const mockResults: OptimizationResult = {
        score: totalScore,
        title: {
          score: titleScore,
          feedback: [
            "Title contains relevant keywords",
            title.length > 150 ? "Title is too long (should be 150 characters max)" : "Title length is good",
            title.toUpperCase() === title ? "Avoid using ALL CAPS in your title" : "Good use of capitalization",
          ],
          suggestions: [
            "Add more specific product attributes",
            "Include your brand name early in the title",
            "Optimize for mobile by placing key information first"
          ]
        },
        bullets: {
          score: bulletsScore,
          feedback: bulletPoints ? [
            "Bullet points highlight product benefits",
            bulletPoints.split('\n').length >= 5 ? "Good number of bullet points" : "Add more bullet points (5 recommended)",
            "Use more specific details about product features"
          ] : ["No bullet points provided"],
          suggestions: bulletPoints ? [
            "Start each bullet point with a benefit, not a feature",
            "Include measurable details when possible",
            "Address common customer questions in bullets"
          ] : []
        },
        description: {
          score: descriptionScore,
          feedback: description ? [
            "Description includes keyword-rich content",
            description.length > 2000 ? "Description is a good length" : "Consider a longer, more detailed description",
            "Add more formatting to improve readability"
          ] : ["No description provided"],
          suggestions: description ? [
            "Add paragraph breaks for better readability",
            "Include more specific use cases for your product",
            "Address potential customer objections in the description"
          ] : []
        }
      };
      
      setResults(mockResults);
      setLoading(false);
      
      toast({
        title: "Analysis Complete",
        description: `Your listing score is ${mockResults.score}%`,
      });
    }, 2000);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };
  
  return (
    <ToolLayout 
      title="Listing Optimization Checker" 
      icon={<FileText className="h-6 w-6" />}
      description="Analyze your product listings and receive optimization suggestions."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Listing Content</h2>
          
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Product Title*
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your product title..."
                className="h-auto py-2"
              />
              <p className="text-xs text-muted-foreground">
                Character count: {title.length}/200
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="bulletPoints" className="text-sm font-medium">
                Bullet Points
              </label>
              <Textarea
                id="bulletPoints"
                value={bulletPoints}
                onChange={(e) => setBulletPoints(e.target.value)}
                placeholder="Enter your bullet points, one per line..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Use bullet points to highlight key features and benefits.
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Product Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter your product description..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Character count: {description.length}/2000
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || !title}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze Listing
                </>
              )}
            </Button>
          </form>
        </div>
        
        <div>
          {results ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-lg font-semibold mb-4">Overall Listing Score</h2>
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(results.score)}`}>
                  {results.score}%
                </div>
                <Progress 
                  value={results.score} 
                  className={`h-2 w-48 mx-auto ${getProgressColor(results.score)}`} 
                />
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2 flex items-center justify-between">
                    Title Analysis
                    <span className={`text-sm ${getScoreColor(results.title.score)}`}>
                      {results.title.score}%
                    </span>
                  </h3>
                  <Progress 
                    value={results.title.score} 
                    className={`h-1.5 mb-4 ${getProgressColor(results.title.score)}`} 
                  />
                  
                  <div className="space-y-1 mb-4">
                    {results.title.feedback.map((item, index) => (
                      <div key={index} className="flex items-start text-sm">
                        {item.includes("too long") || item.includes("ALL CAPS") ? (
                          <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                        )}
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {results.title.suggestions.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {bulletPoints && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2 flex items-center justify-between">
                      Bullet Points Analysis
                      <span className={`text-sm ${getScoreColor(results.bullets.score)}`}>
                        {results.bullets.score}%
                      </span>
                    </h3>
                    <Progress 
                      value={results.bullets.score} 
                      className={`h-1.5 mb-4 ${getProgressColor(results.bullets.score)}`} 
                    />
                    
                    <div className="space-y-1 mb-4">
                      {results.bullets.feedback.map((item, index) => (
                        <div key={index} className="flex items-start text-sm">
                          {item.includes("more") ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 shrink-0" />
                          ) : (
                            <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                          )}
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {results.bullets.suggestions.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              {description && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2 flex items-center justify-between">
                      Description Analysis
                      <span className={`text-sm ${getScoreColor(results.description.score)}`}>
                        {results.description.score}%
                      </span>
                    </h3>
                    <Progress 
                      value={results.description.score} 
                      className={`h-1.5 mb-4 ${getProgressColor(results.description.score)}`} 
                    />
                    
                    <div className="space-y-1 mb-4">
                      {results.description.feedback.map((item, index) => (
                        <div key={index} className="flex items-start text-sm">
                          {item.includes("longer") ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 shrink-0" />
                          ) : (
                            <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                          )}
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {results.description.suggestions.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Analysis Yet</h3>
              <p className="text-muted-foreground mb-2">
                Enter your listing details and click "Analyze Listing" to get optimization suggestions
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Our algorithm will check your title, bullet points, and description for Amazon SEO best practices
              </p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
};

export default ListingOptimizer;
