import React from 'react';
import AnalysisToolPage from '@/components/AnalysisToolPage';

export default function WebSearch() {
  return <AnalysisToolPage titleKey="web_search" placeholderKey="enter_query" functionName="webSearch" actionKey="search" costFeature="web_search" />;
}