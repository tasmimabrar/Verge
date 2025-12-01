/**
 * AI Service - Mock AI logic for prototype
 * 
 * Uses rule-based logic to generate suggestions.
 * Can be replaced with real AI API calls later.
 */

import type { Task } from '@/shared/types';
import type { SubtaskSuggestion } from '@/features/tasks/components/AIAssistPanel';

/**
 * Generate subtask suggestions based on task title and context
 * Uses keyword matching and common patterns for prototype
 */
export const generateSubtaskSuggestions = (task: Task): SubtaskSuggestion[] => {
  const title = task.title.toLowerCase();
  const suggestions: SubtaskSuggestion[] = [];

  // Rule-based suggestions based on keywords
  
  // Design-related tasks
  if (title.includes('design') || title.includes('mockup') || title.includes('wireframe')) {
    suggestions.push({
      id: 'sub_1',
      title: 'Create initial wireframes and layout sketches',
      reasoning: 'Starting with wireframes helps establish the visual structure before detailed design work.',
      estimatedEffort: '1 hour',
    });
    suggestions.push({
      id: 'sub_2',
      title: 'Design high-fidelity mockups',
      reasoning: 'High-fidelity mockups provide pixel-perfect visuals for development.',
      estimatedEffort: '2 hours',
    });
    suggestions.push({
      id: 'sub_3',
      title: 'Get stakeholder feedback and iterate',
      reasoning: 'Early feedback prevents costly revisions later in the process.',
      estimatedEffort: '30 min',
    });
  }
  
  // Development tasks
  else if (title.includes('develop') || title.includes('build') || title.includes('code') || title.includes('implement')) {
    suggestions.push({
      id: 'sub_1',
      title: 'Set up project structure and dependencies',
      reasoning: 'A solid foundation makes development faster and more organized.',
      estimatedEffort: '30 min',
    });
    suggestions.push({
      id: 'sub_2',
      title: 'Write core functionality and logic',
      reasoning: 'Focus on the main features first before adding edge cases.',
      estimatedEffort: '3 hours',
    });
    suggestions.push({
      id: 'sub_3',
      title: 'Add error handling and edge cases',
      reasoning: 'Robust error handling prevents bugs in production.',
      estimatedEffort: '1 hour',
    });
    suggestions.push({
      id: 'sub_4',
      title: 'Write tests and documentation',
      reasoning: 'Tests ensure reliability and docs help future maintainers.',
      estimatedEffort: '1 hour',
    });
  }
  
  // Research tasks
  else if (title.includes('research') || title.includes('analyze') || title.includes('investigate')) {
    suggestions.push({
      id: 'sub_1',
      title: 'Define research questions and scope',
      reasoning: 'Clear questions keep research focused and productive.',
      estimatedEffort: '20 min',
    });
    suggestions.push({
      id: 'sub_2',
      title: 'Gather and review relevant sources',
      reasoning: 'Comprehensive sources provide better insights and context.',
      estimatedEffort: '2 hours',
    });
    suggestions.push({
      id: 'sub_3',
      title: 'Synthesize findings and document insights',
      reasoning: 'Documentation helps share knowledge with the team.',
      estimatedEffort: '1 hour',
    });
  }
  
  // Writing/Content tasks
  else if (title.includes('write') || title.includes('content') || title.includes('blog') || title.includes('article')) {
    suggestions.push({
      id: 'sub_1',
      title: 'Create outline and key points',
      reasoning: 'An outline provides structure and ensures nothing is missed.',
      estimatedEffort: '30 min',
    });
    suggestions.push({
      id: 'sub_2',
      title: 'Write first draft',
      reasoning: 'Getting ideas down first makes editing much easier.',
      estimatedEffort: '2 hours',
    });
    suggestions.push({
      id: 'sub_3',
      title: 'Edit and refine content',
      reasoning: 'Editing improves clarity and fixes errors.',
      estimatedEffort: '45 min',
    });
    suggestions.push({
      id: 'sub_4',
      title: 'Add visuals and formatting',
      reasoning: 'Visual elements make content more engaging and readable.',
      estimatedEffort: '30 min',
    });
  }
  
  // Meeting/Presentation tasks
  else if (title.includes('meeting') || title.includes('presentation') || title.includes('demo')) {
    suggestions.push({
      id: 'sub_1',
      title: 'Prepare agenda and key discussion points',
      reasoning: 'An agenda keeps meetings focused and productive.',
      estimatedEffort: '15 min',
    });
    suggestions.push({
      id: 'sub_2',
      title: 'Create slides or visual materials',
      reasoning: 'Visuals help communicate ideas more effectively.',
      estimatedEffort: '1 hour',
    });
    suggestions.push({
      id: 'sub_3',
      title: 'Practice presentation and timing',
      reasoning: 'Practice builds confidence and ensures smooth delivery.',
      estimatedEffort: '30 min',
    });
  }
  
  // Testing/QA tasks
  else if (title.includes('test') || title.includes('qa') || title.includes('debug') || title.includes('fix')) {
    suggestions.push({
      id: 'sub_1',
      title: 'Identify test cases and scenarios',
      reasoning: 'Comprehensive test cases catch more bugs early.',
      estimatedEffort: '30 min',
    });
    suggestions.push({
      id: 'sub_2',
      title: 'Execute tests and document results',
      reasoning: 'Systematic testing ensures nothing is overlooked.',
      estimatedEffort: '1 hour',
    });
    suggestions.push({
      id: 'sub_3',
      title: 'Fix identified issues',
      reasoning: 'Addressing bugs promptly prevents them from compounding.',
      estimatedEffort: '2 hours',
    });
    suggestions.push({
      id: 'sub_4',
      title: 'Verify fixes and regression test',
      reasoning: 'Verification ensures fixes work without breaking other features.',
      estimatedEffort: '30 min',
    });
  }
  
  // Review/Feedback tasks
  else if (title.includes('review') || title.includes('feedback') || title.includes('evaluate')) {
    suggestions.push({
      id: 'sub_1',
      title: 'Review materials thoroughly',
      reasoning: 'Careful review catches issues others might miss.',
      estimatedEffort: '1 hour',
    });
    suggestions.push({
      id: 'sub_2',
      title: 'Document feedback and suggestions',
      reasoning: 'Written feedback is clearer and easier to act on.',
      estimatedEffort: '30 min',
    });
    suggestions.push({
      id: 'sub_3',
      title: 'Discuss findings with team',
      reasoning: 'Discussion helps clarify feedback and align expectations.',
      estimatedEffort: '30 min',
    });
  }
  
  // Generic fallback for other tasks
  else {
    suggestions.push({
      id: 'sub_1',
      title: 'Break down the task into smaller steps',
      reasoning: 'Smaller steps are easier to track and complete.',
      estimatedEffort: '15 min',
    });
    suggestions.push({
      id: 'sub_2',
      title: 'Complete the main work',
      reasoning: 'Focus on the core deliverable first.',
      estimatedEffort: '2 hours',
    });
    suggestions.push({
      id: 'sub_3',
      title: 'Review and finalize',
      reasoning: 'A final review ensures quality before completion.',
      estimatedEffort: '30 min',
    });
  }

  return suggestions;
};
