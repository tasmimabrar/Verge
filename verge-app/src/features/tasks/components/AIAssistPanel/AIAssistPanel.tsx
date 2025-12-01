import { useEffect, useState } from 'react';
import { FiX, FiStar, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { Button } from '@/shared/components';
import type { Task } from '@/shared/types';
import { generateSubtaskSuggestions } from '@/shared/services/aiService';
import styles from './AIAssistPanel.module.css';

export interface SubtaskSuggestion {
  id: string;
  title: string;
  reasoning: string;
  estimatedEffort: string; // e.g., "15 min", "1 hour"
}

export interface AIAssistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onAcceptSuggestions: (subtasks: string[]) => Promise<void>;
}

export const AIAssistPanel = ({ isOpen, onClose, task, onAcceptSuggestions }: AIAssistPanelProps) => {
  const [suggestions, setSuggestions] = useState<SubtaskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  // Generate suggestions when panel opens
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      const loadSuggestions = async () => {
        setIsLoading(true);
        
        // Simulate AI processing (500ms delay for realism)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate suggestions using mock AI
        const newSuggestions = generateSubtaskSuggestions(task);
        
        setSuggestions(newSuggestions);
        setIsLoading(false);
      };
      
      loadSuggestions();
    }
  }, [isOpen, task, suggestions.length]);

  const handleAccept = async (suggestion: SubtaskSuggestion) => {
    setAcceptedIds(prev => new Set([...prev, suggestion.id]));
    
    // Add to task subtasks
    await onAcceptSuggestions([suggestion.title]);
    
    // Remove from suggestions after brief delay for visual feedback
    setTimeout(() => {
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }, 500);
  };

  const handleDismiss = (suggestion: SubtaskSuggestion) => {
    setDismissedIds(prev => new Set([...prev, suggestion.id]));
    
    // Remove from suggestions
    setTimeout(() => {
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }, 300);
  };

  const handleAcceptAll = async () => {
    const allTitles = suggestions.map(s => s.title);
    
    // Mark all as accepted for animation
    const allIds = new Set(suggestions.map(s => s.id));
    setAcceptedIds(allIds);
    
    // Add all subtasks
    await onAcceptSuggestions(allTitles);
    
    // Clear suggestions after brief delay
    setTimeout(() => {
      setSuggestions([]);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  const visibleSuggestions = suggestions.filter(s => !dismissedIds.has(s.id));

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <FiStar className={styles.headerIcon} />
            <h2 className={styles.title}>AI Assist</h2>
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close AI Assist panel"
          >
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner} />
              <p className={styles.loadingText}>Analyzing task and generating suggestions...</p>
            </div>
          ) : visibleSuggestions.length > 0 ? (
            <>
              <div className={styles.intro}>
                <p>Based on your task, here are some suggested subtasks to help you break down the work:</p>
              </div>

              {/* Suggestions List */}
              <div className={styles.suggestions}>
                {visibleSuggestions.map(suggestion => {
                  const isAccepted = acceptedIds.has(suggestion.id);
                  
                  return (
                    <div 
                      key={suggestion.id} 
                      className={`${styles.suggestionCard} ${isAccepted ? styles.accepted : ''}`}
                    >
                      {isAccepted && (
                        <div className={styles.acceptedBadge}>
                          <FiCheckCircle />
                          <span>Added</span>
                        </div>
                      )}
                      
                      <div className={styles.suggestionHeader}>
                        <h3 className={styles.suggestionTitle}>{suggestion.title}</h3>
                        <span className={styles.effort}>{suggestion.estimatedEffort}</span>
                      </div>
                      
                      <p className={styles.reasoning}>{suggestion.reasoning}</p>
                      
                      <div className={styles.actions}>
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleAccept(suggestion)}
                          disabled={isAccepted}
                        >
                          <FiCheck />
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => handleDismiss(suggestion)}
                          disabled={isAccepted}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Accept All Button */}
              {visibleSuggestions.length > 1 && (
                <div className={styles.footer}>
                  <Button
                    variant="primary"
                    onClick={handleAcceptAll}
                  >
                    <FiCheck />
                    Accept All ({visibleSuggestions.length})
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.empty}>
              <FiCheckCircle className={styles.emptyIcon} />
              <p className={styles.emptyText}>
                {suggestions.length === 0 
                  ? "No suggestions available for this task."
                  : "All suggestions processed!"
                }
              </p>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
