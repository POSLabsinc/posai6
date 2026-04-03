import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FileText, AlertTriangle, Clock, X } from 'lucide-react';

interface SavedNote {
  text: string;
  category: 'allergy' | 'recent' | 'general';
  timestamp: number;
}

interface OrderNotesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  storageKey?: string;
  disabled?: boolean;
}

const DEFAULT_STORAGE_KEY = 'order-notes-history';

// Default allergy notes that are always available
const DEFAULT_ALLERGY_NOTES: SavedNote[] = [
  { text: 'Allergic to nuts', category: 'allergy', timestamp: 0 },
  { text: 'Allergic to peanuts', category: 'allergy', timestamp: 0 },
  { text: 'Allergic to shellfish', category: 'allergy', timestamp: 0 },
  { text: 'Allergic to dairy', category: 'allergy', timestamp: 0 },
  { text: 'Allergic to gluten', category: 'allergy', timestamp: 0 },
  { text: 'Allergic to eggs', category: 'allergy', timestamp: 0 },
  { text: 'Allergic to soy', category: 'allergy', timestamp: 0 },
];

const DEFAULT_GENERAL_NOTES: SavedNote[] = [
  { text: 'No cutlery needed', category: 'general', timestamp: 0 },
  { text: 'Extra napkins please', category: 'general', timestamp: 0 },
  { text: 'To-go containers needed', category: 'general', timestamp: 0 },
  { text: 'Birthday celebration', category: 'general', timestamp: 0 },
  { text: 'VIP customer', category: 'general', timestamp: 0 },
];

// Delimiter used to separate multiple notes
const NOTE_DELIMITER = ' | ';

export const OrderNotesAutocomplete: React.FC<OrderNotesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Order notes",
  className = "",
  storageKey = DEFAULT_STORAGE_KEY,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse selected notes from value string
  const selectedNotes = useMemo(() => {
    if (!value.trim()) return [];
    return value.split(NOTE_DELIMITER).map(n => n.trim()).filter(Boolean);
  }, [value]);

  // Load saved notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SavedNote[];
        setSavedNotes(parsed);
      } catch {
        setSavedNotes([]);
      }
    }
  }, []);

  // Save note to history
  const saveNoteToHistory = (noteText: string) => {
    if (!noteText.trim()) return;
    
    const normalizedText = noteText.trim();
    const isAllergy = normalizedText.toLowerCase().includes('allerg');
    
    // Check if it already exists in saved notes
    const existingIndex = savedNotes.findIndex(
      n => n.text.toLowerCase() === normalizedText.toLowerCase()
    );
    
    let updatedNotes: SavedNote[];
    
    if (existingIndex >= 0) {
      // Update timestamp for existing note
      updatedNotes = savedNotes.map((n, i) => 
        i === existingIndex ? { ...n, timestamp: Date.now() } : n
      );
    } else {
      // Add new note
      const newNote: SavedNote = {
        text: normalizedText,
        category: isAllergy ? 'allergy' : 'recent',
        timestamp: Date.now(),
      };
      updatedNotes = [newNote, ...savedNotes].slice(0, 50); // Keep max 50 notes
    }
    
    setSavedNotes(updatedNotes);
    localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
  };

  // Filter suggestions based on input (excluding already selected notes)
  const filteredSuggestions = useMemo(() => {
    const searchTerm = inputValue.toLowerCase().trim();
    
    // Combine all notes: saved (recent) + default allergies + default general
    const allNotes = [
      ...savedNotes,
      ...DEFAULT_ALLERGY_NOTES.filter(d => 
        !savedNotes.some(s => s.text.toLowerCase() === d.text.toLowerCase())
      ),
      ...DEFAULT_GENERAL_NOTES.filter(d => 
        !savedNotes.some(s => s.text.toLowerCase() === d.text.toLowerCase())
      ),
    ];
    
    // Filter out already selected notes
    const availableNotes = allNotes.filter(
      n => !selectedNotes.some(s => s.toLowerCase() === n.text.toLowerCase())
    );
    
    // Filter by search term
    const filtered = searchTerm 
      ? availableNotes.filter(n => n.text.toLowerCase().includes(searchTerm))
      : availableNotes;
    
    // Sort: recent first (by timestamp), then allergies, then general
    return filtered.sort((a, b) => {
      // Recent user-added notes first (by timestamp)
      if (a.timestamp > 0 && b.timestamp > 0) {
        return b.timestamp - a.timestamp;
      }
      if (a.timestamp > 0) return -1;
      if (b.timestamp > 0) return 1;
      
      // Then allergies
      if (a.category === 'allergy' && b.category !== 'allergy') return -1;
      if (b.category === 'allergy' && a.category !== 'allergy') return 1;
      
      return 0;
    }).slice(0, 8); // Show max 8 suggestions
  }, [inputValue, savedNotes, selectedNotes]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // If there's text in the input, add it as a note
        if (inputValue.trim()) {
          addNote(inputValue.trim());
          setInputValue('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, selectedNotes]);

  const addNote = (noteText: string) => {
    const trimmedNote = noteText.trim();
    if (!trimmedNote) return;
    
    // Check if already selected
    if (selectedNotes.some(n => n.toLowerCase() === trimmedNote.toLowerCase())) {
      return;
    }
    
    const newNotes = [...selectedNotes, trimmedNote];
    onChange(newNotes.join(NOTE_DELIMITER));
    saveNoteToHistory(trimmedNote);
  };

  const removeNote = (noteToRemove: string) => {
    const newNotes = selectedNotes.filter(n => n !== noteToRemove);
    onChange(newNotes.join(NOTE_DELIMITER));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSelectSuggestion = (note: SavedNote) => {
    addNote(note.text);
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addNote(inputValue.trim());
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && selectedNotes.length > 0) {
      // Remove last note if backspace is pressed with empty input
      removeNote(selectedNotes[selectedNotes.length - 1]);
    }
  };

  const getCategoryIcon = (category: string, timestamp: number) => {
    if (timestamp > 0 && category === 'recent') {
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
    if (category === 'allergy') {
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const getCategoryLabel = (category: string, timestamp: number) => {
    if (timestamp > 0) return 'RECENT';
    if (category === 'allergy') return 'ALLERGY';
    return null;
  };

  const getNoteCategory = (noteText: string): 'allergy' | 'recent' | 'general' => {
    if (noteText.toLowerCase().includes('allerg')) return 'allergy';
    return 'general';
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className="flex items-center gap-2 rounded px-3 py-2 flex-wrap min-h-[40px] cursor-text" 
        style={{
          background: '#7575754D',
          boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        
        {/* Selected notes as tags */}
        {selectedNotes.map((note, index) => {
          const isAllergy = getNoteCategory(note) === 'allergy';
          return (
            <span
              key={`${note}-${index}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                isAllergy 
                  ? 'bg-red-900/50 text-red-300 border border-red-700/50' 
                  : 'bg-neutral-600 text-neutral-200 border border-neutral-500/50'
              }`}
            >
              {isAllergy && <AlertTriangle className="w-3 h-3" />}
              <span className="truncate max-w-[120px]">{note}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNote(note);
                }}
                className="ml-0.5 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedNotes.length === 0 ? placeholder : "Add more..."}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50 shadow-lg border border-sidebar-border max-h-[240px] overflow-y-auto"
          style={{
            background: '#2D2D2D',
          }}
        >
          {filteredSuggestions.map((note, index) => {
            const categoryLabel = getCategoryLabel(note.category, note.timestamp);
            return (
              <button
                key={`${note.text}-${index}`}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
                onClick={() => handleSelectSuggestion(note)}
              >
                {getCategoryIcon(note.category, note.timestamp)}
                <span className="flex-1 text-sm text-white truncate">{note.text}</span>
                {categoryLabel && (
                  <span 
                    className={`text-xs px-2 py-0.5 rounded ${
                      categoryLabel === 'ALLERGY' 
                        ? 'bg-red-900/50 text-red-400' 
                        : 'bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {categoryLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderNotesAutocomplete;
