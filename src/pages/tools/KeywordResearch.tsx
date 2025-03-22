
import React, { useState } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/FileUploader';

interface Keyword {
  keyword: string;
  volume: number;
  competition: number;
  relevance: number;
}

const KeywordResearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Keyword[]>([]);
  const { toast } = useToast();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm) {
      toast({
        title: "Error",
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Mock data based on search term
      const mockKeywords: Keyword[] = [
        { 
          keyword: `${searchTerm} for amazon`, 
          volume: Math.floor(Math.random() * 10000) + 1000,
          competition: Math.random() * 0.9 + 0.1,
          relevance: Math.random() * 0.9 + 0.1
        },
        { 
          keyword: `best ${searchTerm}`, 
          volume: Math.floor(Math.random() * 10000) + 1000,
          competition: Math.random() * 0.9 + 0.1,
          relevance: Math.random() * 0.9 + 0.1
        },
        { 
          keyword: `${searchTerm} for sale`, 
          volume: Math.floor(Math.random() * 10000) + 1000,
          competition: Math.random() * 0.9 + 0.1,
          relevance: Math.random() * 0.9 + 0.1
        },
        { 
          keyword: `cheap ${searchTerm}`, 
          volume: Math.floor(Math.random() * 10000) + 1000,
          competition: Math.random() * 0.9 + 0.1,
          relevance: Math.random() * 0.9 + 0.1
        },
        { 
          keyword: `${searchTerm} review`, 
          volume: Math.floor(Math.random() * 10000) + 1000,
          competition: Math.random() * 0.9 + 0.1,
          relevance: Math.random() * 0.9 + 0.1
        }
      ];
      
      setResults(mockKeywords);
      setLoading(false);
      
      toast({
        title: "Search Complete",
        description: `Found ${mockKeywords.length} keywords for "${searchTerm}"`,
      });
    }, 1500);
  };
  
  const handleImportData = (data: any[]) => {
    // Process imported data from CSV or Google Sheets
    // For this example, assume it contains a "Keyword" column
    const importedKeywords: Keyword[] = data.map(item => ({
      keyword: item.Keyword || item.keyword || '',
      volume: parseInt(item.Volume || item.volume || Math.floor(Math.random() * 10000) + 1000),
      competition: parseFloat(item.Competition || item.competition || (Math.random() * 0.9 + 0.1).toFixed(2)),
      relevance: parseFloat(item.Relevance || item.relevance || (Math.random() * 0.9 + 0.1).toFixed(2))
    }));
    
    setResults(importedKeywords);
    
    toast({
      title: "Import Complete",
      description: `Imported ${importedKeywords.length} keywords from your file`,
    });
  };
  
  const getCompetitionLabel = (value: number) => {
    if (value < 0.3) return "Low";
    if (value < 0.7) return "Medium";
    return "High";
  };
  
  const getRelevanceLabel = (value: number) => {
    if (value < 0.3) return "Low";
    if (value < 0.7) return "Medium";
    return "High";
  };
  
  return (
    <ToolLayout 
      title="Keyword Research Tool" 
      icon={<Search className="h-6 w-6" />}
      description="Identify high-volume, relevant keywords to optimize your product listings."
    >
      <div className="max-w-3xl mx-auto">
        <FileUploader 
          onDataReady={handleImportData}
          title="Import Keyword Data"
          description="Upload a CSV file with your keyword data or connect to a Google Sheet"
        />
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter a product or keyword..."
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </form>
        
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">
              {searchTerm ? `Keywords for "${searchTerm}"` : "Imported Keywords"}
            </h2>
            
            <div className="grid grid-cols-12 gap-4 mb-2 px-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Keyword</div>
              <div className="col-span-2">Search Volume</div>
              <div className="col-span-2">Competition</div>
              <div className="col-span-3">Relevance</div>
            </div>
            
            {results.map((keyword, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-12 gap-4 p-4 items-center">
                    <div className="col-span-5 font-medium">{keyword.keyword}</div>
                    <div className="col-span-2">{keyword.volume.toLocaleString()}</div>
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {getCompetitionLabel(keyword.competition)}
                        </div>
                        <Progress value={keyword.competition * 100} />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {getRelevanceLabel(keyword.relevance)}
                        </div>
                        <Progress 
                          value={keyword.relevance * 100} 
                          className="bg-sellsmart-teal/20"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="bg-muted p-4 rounded-lg mt-6">
              <h3 className="flex items-center text-sm font-medium">
                <Check className="h-4 w-4 mr-2 text-sellsmart-teal" />
                Pro Tip
              </h3>
              <p className="text-sm text-muted-foreground">
                Look for keywords with high search volume and low competition for the best results. Include these in your product title, bullet points, and description.
              </p>
            </div>
          </div>
        )}
        
        {!loading && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Enter a keyword to start</h3>
            <p className="text-muted-foreground">
              Try searching for product types, brands, or specific features
            </p>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default KeywordResearch;
