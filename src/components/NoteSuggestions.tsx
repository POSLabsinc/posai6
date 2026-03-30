import { useMemo } from "react";

// Predefined suggestion lists for restaurant use
// KDS-specific phrases to exclude from order note suggestions
const kdsExcludedPhrases = [
  "low stock warning",
  "rush this order",
  "hold this order",
  "fire when ready",
  "86'd - out of stock",
  "remake needed",
  "special request",
  "extra sauce on the side",
];

const frequentNotes = [
  "No substitutions",
  "Split check",
  "Rush order",
  "VIP guest",
  "Birthday celebration",
  "Anniversary dinner",
  "Extra napkins",
  "High chair needed",
  "Quiet table preferred",
  "Waiting for more guests",
  "Late arrival",
  "Ready to order",
  "Check back in 5 min",
  "Manager requested",
  "Comp this item",
  "Remake requested",
  "To-go containers needed",
  "Water refill",
  "Separate checks",
  "Cash payment",
];

const allergyNotes = [
  "Allergic to nuts",
  "Allergic to almonds",
  "Allergic to peanuts",
  "Allergic to shellfish",
  "Allergic to dairy",
  "Allergic to gluten",
  "Allergic to eggs",
  "Allergic to soy",
  "Allergic to fish",
  "Allergic to sesame",
  "Lactose intolerant",
  "Gluten-free required",
  "Celiac disease",
  "Vegan diet",
  "Vegetarian diet",
  "Kosher meal",
  "Halal meal",
  "No MSG",
  "No garlic",
  "No onion",
  "Don't add onion",
  "Don't add garlic",
  "No spicy",
  "Extra spicy",
  "No cilantro",
  "No tomatoes",
  "No cheese",
];

interface NoteSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  currentValue: string;
  recentNotes?: string[];
}

export default function NoteSuggestions({ query, onSelect, currentValue, recentNotes = [] }: NoteSuggestionsProps) {
  // Process recent notes into individual phrases
  const processedRecentNotes = useMemo(() => {
    const allPhrases: string[] = [];
    recentNotes.forEach(note => {
      // Split by comma and clean up each phrase
      const phrases = note.split(',').map(p => p.trim()).filter(p => p.length > 0);
      phrases.forEach(phrase => {
        // Exclude KDS-specific phrases from recent notes
        const isKdsPhrase = kdsExcludedPhrases.some(kds => phrase.toLowerCase().includes(kds));
        if (!allPhrases.includes(phrase) && !isKdsPhrase) {
          allPhrases.push(phrase);
        }
      });
    });
    return allPhrases.slice(0, 10);
  }, [recentNotes]);

  const suggestions = useMemo(() => {
    const searchTerm = query.toLowerCase().trim();
    const currentLower = currentValue.toLowerCase();
    
    // If no search term, show recent notes
    if (!searchTerm || searchTerm.length < 1) {
      const recentFiltered = processedRecentNotes.filter(note => 
        !currentLower.includes(note.toLowerCase())
      ).slice(0, 5);
      
      return recentFiltered.map(note => ({
        text: note,
        type: 'recent' as const
      }));
    }
    
    // Search across all sources
    const allSuggestions = [...frequentNotes, ...allergyNotes];
    
    const results: { text: string; type: 'recent' | 'allergy' | 'frequent' }[] = [];
    
    // First add matching recent notes
    processedRecentNotes.forEach(note => {
      if (note.toLowerCase().includes(searchTerm) && !currentLower.includes(note.toLowerCase())) {
        results.push({ text: note, type: 'recent' });
      }
    });
    
    // Then add matching allergy notes
    allergyNotes.forEach(note => {
      if (note.toLowerCase().includes(searchTerm) && 
          !currentLower.includes(note.toLowerCase()) &&
          !results.some(r => r.text.toLowerCase() === note.toLowerCase())) {
        results.push({ text: note, type: 'allergy' });
      }
    });
    
    // Then add matching frequent notes
    frequentNotes.forEach(note => {
      if (note.toLowerCase().includes(searchTerm) && 
          !currentLower.includes(note.toLowerCase()) &&
          !results.some(r => r.text.toLowerCase() === note.toLowerCase())) {
        results.push({ text: note, type: 'frequent' });
      }
    });
    
    // Sort: starts with query first
    results.sort((a, b) => {
      const aStarts = a.text.toLowerCase().startsWith(searchTerm);
      const bStarts = b.text.toLowerCase().startsWith(searchTerm);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      // Recent notes get priority
      if (a.type === 'recent' && b.type !== 'recent') return -1;
      if (a.type !== 'recent' && b.type === 'recent') return 1;
      return 0;
    });
    
    return results.slice(0, 5);
  }, [query, currentValue, processedRecentNotes]);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(suggestion.text)}
          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-800 transition-colors flex items-center gap-2 border-b border-neutral-800 last:border-b-0"
        >
          <span className={`text-base ${suggestion.type === 'allergy' ? '' : 'opacity-70'}`}>
            {suggestion.type === 'recent' ? '🕐' : suggestion.type === 'allergy' ? '⚠️' : '📝'}
          </span>
          <span className="text-white/90 flex-1">{suggestion.text}</span>
          {suggestion.type === 'recent' && (
            <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] font-medium rounded">
              RECENT
            </span>
          )}
          {suggestion.type === 'allergy' && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-medium rounded">
              ALLERGY
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
