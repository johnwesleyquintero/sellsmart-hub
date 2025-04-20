import { useGemini } from '@/lib/ai-config';
import React, { useState } from 'react';

type SEOAnalyzerProps = {
  keywordData: {
    keyword: string;
    volume: number;
    difficulty: number;
    cpc: number;
    competition: number;
  }[];
};

export const SEOAnalyzer: React.FC<SEOAnalyzerProps> = ({ keywordData }) => {
  const gemini = useGemini();
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const analyzeKeywords = async () => {
    const prompt = `Analyze these SEO keywords:\n${keywordData.map(k => `${k.keyword}: Vol=${k.volume}, Diff=${k.difficulty}, CPC=${k.cpc}, Comp=${k.competition}`).join('\n')}\n\nProvide insights on:\n1. Best opportunities (high volume, low difficulty)\n2. Competitive terms to avoid\n3. CPC trends\n4. Recommended strategy`;
    
    const result = await gemini.generateContent({
      model: 'gemini-2.0-flash-001',
      prompt,
      maxOutputTokens: 1500,
      temperature: 0.4
    });

    setAnalysisResult(result.text());
    return result.text();
  };

  return (
    <div className="seo-analyzer">
      <h2>SEO Keyword Analysis</h2>
      <div className="keyword-metrics">
        {keywordData.map((keyword, index) => (
          <div key={index} className="keyword-card">
            <h3>{keyword.keyword}</h3>
            <div>Volume: {keyword.volume}</div>
            <div>Difficulty: {keyword.difficulty}</div>
            <div>CPC: ${keyword.cpc}</div>
            <div>Competition: {keyword.competition}</div>
          </div>
        ))}
      </div>
      <button onClick={analyzeKeywords}>Generate Insights</button>
      {analysisResult && (
        <div className="analysis-result">
          <h3>Analysis Result:</h3>
          <pre>{analysisResult}</pre>
        </div>
      )}
    </div>
  );
};