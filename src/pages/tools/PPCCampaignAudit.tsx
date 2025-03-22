
import React, { useState } from 'react';
import { Target, ArrowDownUp, BarChart, DollarSign, Search, Loader2, Plus } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
}

interface AuditResult {
  campaignId: string;
  overall: {
    score: number;
    summary: string;
  };
  metrics: {
    ctr: {
      value: number;
      benchmark: number;
      score: number;
    };
    acos: {
      value: number;
      benchmark: number;
      score: number;
    };
    conversionRate: {
      value: number;
      benchmark: number;
      score: number;
    };
    cpc: {
      value: number;
      benchmark: number;
      score: number;
    };
    impressionShare: {
      value: number;
      benchmark: number;
      score: number;
    };
  };
  recommendations: string[];
}

const PPCCampaignAudit = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "1",
      name: "Summer Collection - Broad",
      budget: 20,
      spend: 18.45,
      impressions: 2140,
      clicks: 87,
      orders: 5,
      revenue: 147.95
    },
    {
      id: "2",
      name: "Premium Products - Exact",
      budget: 30,
      spend: 27.89,
      impressions: 1850,
      clicks: 112,
      orders: 9,
      revenue: 312.45
    },
    {
      id: "3",
      name: "New Arrivals - Auto",
      budget: 15,
      spend: 12.78,
      impressions: 1432,
      clicks: 53,
      orders: 2,
      revenue: 57.90
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const { toast } = useToast();
  
  const filteredCampaigns = campaigns.filter(camp => 
    camp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAudit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setLoading(true);
    setAuditResult(null);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const ctr = (campaign.clicks / campaign.impressions) * 100;
      const acos = campaign.revenue > 0 ? (campaign.spend / campaign.revenue) * 100 : 100;
      const conversionRate = (campaign.orders / campaign.clicks) * 100;
      const cpc = campaign.spend / campaign.clicks;
      
      const mockResult: AuditResult = {
        campaignId: campaign.id,
        overall: {
          score: Math.floor(Math.random() * 40) + 60,
          summary: `Your campaign "${campaign.name}" has ${
            acos < 20 ? "strong" : acos < 35 ? "moderate" : "concerning"
          } performance metrics. ${
            conversionRate > 5 ? "Conversion rate is strong" : "Conversion rate could be improved"
          }.`
        },
        metrics: {
          ctr: {
            value: ctr,
            benchmark: 4,
            score: Math.min(100, (ctr / 4) * 100)
          },
          acos: {
            value: acos,
            benchmark: 25,
            score: Math.min(100, (25 / acos) * 100)
          },
          conversionRate: {
            value: conversionRate,
            benchmark: 5,
            score: Math.min(100, (conversionRate / 5) * 100)
          },
          cpc: {
            value: cpc,
            benchmark: 0.35,
            score: Math.min(100, (0.35 / cpc) * 100)
          },
          impressionShare: {
            value: Math.min(90, Math.floor(Math.random() * 50) + 40),
            benchmark: 70,
            score: Math.min(100, (Math.min(90, Math.floor(Math.random() * 50) + 40) / 70) * 100)
          }
        },
        recommendations: [
          acos > 25 ? "Optimize targeting to reduce ACoS" : "Current ACoS is good, focus on scaling",
          ctr < 4 ? "Improve ad copy to increase CTR" : "CTR is good, consider testing new variants",
          conversionRate < 5 ? "Enhance product listings to boost conversion rate" : "Strong conversion rate, consider increasing bids",
          campaign.budget - campaign.spend < 3 ? "Increase daily budget to capture more traffic" : "Budget utilization is optimal",
          Math.random() > 0.5 ? "Add negative keywords to reduce wasted spend" : "Consider expanding to new keyword groups"
        ]
      };
      
      setAuditResult(mockResult);
      setLoading(false);
      
      toast({
        title: "Audit Complete",
        description: `Campaign "${campaign.name}" audit score: ${mockResult.overall.score}%`,
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
      title="PPC Campaign Audit" 
      icon={<Target className="h-6 w-6" />}
      description="Get insights into your PPC campaign performance and recommendations for improvement."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Your Campaigns</h2>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredCampaigns.length > 0 ? (
              <div className="space-y-2">
                {filteredCampaigns.map((campaign) => (
                  <Card 
                    key={campaign.id}
                    className={`cursor-pointer hover:border-sellsmart-teal/50 transition-colors ${
                      selectedCampaign?.id === campaign.id ? 'border-sellsmart-teal' : ''
                    }`}
                    onClick={() => handleAudit(campaign)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium">{campaign.name}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>
                            ${campaign.spend.toFixed(2)} / ${campaign.budget.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <BarChart className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{campaign.orders} orders</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <Target className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground mb-4">No campaigns found</p>
                <Button className="bg-sellsmart-teal hover:bg-sellsmart-teal/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Campaign
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="h-12 w-12 text-sellsmart-teal animate-spin mb-4" />
              <p className="text-muted-foreground">
                Analyzing campaign performance...
              </p>
            </div>
          ) : auditResult ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedCampaign?.name}</h2>
                  <p className="text-muted-foreground">Campaign Audit Results</p>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(auditResult.overall.score)}`}>
                    {auditResult.overall.score}%
                  </div>
                  <p className="text-sm text-muted-foreground">Audit Score</p>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Performance Summary</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {auditResult.overall.summary}
                  </p>
                  
                  <div className="space-y-4 mt-6">
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium mb-1">CTR</span>
                        <span className={getScoreColor(auditResult.metrics.ctr.score)}>
                          {auditResult.metrics.ctr.value.toFixed(2)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Target: {auditResult.metrics.ctr.benchmark}%
                        </span>
                        <Progress
                          value={auditResult.metrics.ctr.score}
                          className={`h-1 mt-1 ${getProgressColor(auditResult.metrics.ctr.score)}`}
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-medium mb-1">ACoS</span>
                        <span className={getScoreColor(auditResult.metrics.acos.score)}>
                          {auditResult.metrics.acos.value.toFixed(2)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Target: {auditResult.metrics.acos.benchmark}%
                        </span>
                        <Progress
                          value={auditResult.metrics.acos.score}
                          className={`h-1 mt-1 ${getProgressColor(auditResult.metrics.acos.score)}`}
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-medium mb-1">Conv. Rate</span>
                        <span className={getScoreColor(auditResult.metrics.conversionRate.score)}>
                          {auditResult.metrics.conversionRate.value.toFixed(2)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Target: {auditResult.metrics.conversionRate.benchmark}%
                        </span>
                        <Progress
                          value={auditResult.metrics.conversionRate.score}
                          className={`h-1 mt-1 ${getProgressColor(auditResult.metrics.conversionRate.score)}`}
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-medium mb-1">CPC</span>
                        <span className={getScoreColor(auditResult.metrics.cpc.score)}>
                          ${auditResult.metrics.cpc.value.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Target: ${auditResult.metrics.cpc.benchmark.toFixed(2)}
                        </span>
                        <Progress
                          value={auditResult.metrics.cpc.score}
                          className={`h-1 mt-1 ${getProgressColor(auditResult.metrics.cpc.score)}`}
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-medium mb-1">Imp. Share</span>
                        <span className={getScoreColor(auditResult.metrics.impressionShare.score)}>
                          {auditResult.metrics.impressionShare.value.toFixed(0)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Target: {auditResult.metrics.impressionShare.benchmark}%
                        </span>
                        <Progress
                          value={auditResult.metrics.impressionShare.score}
                          className={`h-1 mt-1 ${getProgressColor(auditResult.metrics.impressionShare.score)}`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {auditResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <span className="mr-2 text-sellsmart-teal">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <p className="text-sm text-muted-foreground">
                This analysis is based on your current campaign metrics compared to industry benchmarks.
                For a more comprehensive analysis and advanced optimization strategies, consider our premium PPC management services.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 bg-muted rounded-lg">
              <Target className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Campaign Selected</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Select a campaign from the list to see a detailed performance audit with actionable recommendations.
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Our PPC auditing tool analyzes your campaign metrics against industry benchmarks to help optimize your performance.
              </p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
};

export default PPCCampaignAudit;
