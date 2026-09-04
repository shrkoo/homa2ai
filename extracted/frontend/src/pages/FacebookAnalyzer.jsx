import React from 'react';
import AnalysisToolPage from '@/components/AnalysisToolPage';

export default function FacebookAnalyzer() {
  return <AnalysisToolPage titleKey="facebook_analyzer" placeholderKey="enter_username" functionName="analyzeFacebook" actionKey="analyze" />;
}