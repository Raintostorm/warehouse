// Standardized Button Colors - Slate Theme (Gray with Blue/Red tints)
// All buttons use consistent colors across the application

export const BUTTON_COLORS = {
  // View: Slate Blue (gray with blue tint)
  view: 'linear-gradient(135deg, #475569 0%, #334155 100%)',        // Slate-600 → Slate-700
  
  // Edit: Slate Gray (neutral gray)
  edit: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',         // Slate-500 → Slate-600
  
  // Delete: Slate Red (gray with red tint - darker)
  delete: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',      // Red-800 → Red-900
  
  // Images/File: Gray (neutral)
  images: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',     // Gray-500 → Gray-600
  
  // History: Slate Blue (same as View)
  history: 'linear-gradient(135deg, #475569 0%, #334155 100%)',    // Slate-600 → Slate-700
  
  // Success: Slate Green (gray with green tint - darker)
  success: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',    // Green-800 → Green-900
  
  // Primary: Slate (for main actions)
  primary: 'linear-gradient(135deg, #475569 0%, #334155 100%)',     // Slate-600 → Slate-700
};

// Button text colors (always white for consistency)
export const BUTTON_TEXT_COLOR = 'white';

// Export helper function to get button style
export const getButtonStyle = (type = 'primary', customStyle = {}) => {
  return {
    padding: '6px 12px',
    background: BUTTON_COLORS[type] || BUTTON_COLORS.primary,
    color: BUTTON_TEXT_COLOR,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    ...customStyle
  };
};

