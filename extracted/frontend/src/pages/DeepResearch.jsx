import React from 'react';
import AnalysisToolPage from '@/components/AnalysisToolPage';

export default function DeepResearch() {
  return <AnalysisToolPage titleKey="deep_research" placeholderKey="enter_topic" functionName="deepResearch" multiline actionKey="analyze" costFeature="deep_research" />;
}