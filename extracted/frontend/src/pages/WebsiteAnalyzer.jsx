import React from 'react';
import AnalysisToolPage from '@/components/AnalysisToolPage';

export default function WebsiteAnalyzer() {
  return <AnalysisToolPage titleKey="website_analyzer" placeholderKey="enter_url" functionName="analyzeWebsite" actionKey="analyze" />;
}