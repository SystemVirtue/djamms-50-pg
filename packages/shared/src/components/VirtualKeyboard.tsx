import * as React from 'react';
import { Button } from './ui/button';
import { Delete, Space } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSpace: () => void;
  className?: string;
}

const KeyboardLayout = {
  rows: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ]
};

interface KeyButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'secondary';
}

const KeyButton: React.FC<KeyButtonProps> = ({ 
  children, 
  onPress, 
  className = '',
  variant = 'secondary'
}) => {
  const handlePress = () => {
    // Haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    onPress();
  };

  return (
    <Button
      onClick={handlePress}
      variant={variant}
      className={`
        min-w-[3rem] h-12 
        text-white font-semibold text-lg
        rounded-lg
        active:scale-95 active:bg-orange-600
        touch-manipulation
        transition-all duration-100
        ${className}
      `}
    >
      {children}
    </Button>
  );
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  onSpace,
  className = ''
}) => {
  return (
    <div className={`bg-slate-900 p-4 rounded-lg ${className}`}>
      {/* Number Row */}
      <div className="flex gap-2 mb-2">
        {KeyboardLayout.rows[0].map(key => (
          <KeyButton key={key} onPress={() => onKeyPress(key)}>
            {key}
          </KeyButton>
        ))}
        <KeyButton 
          onPress={onBackspace}
          variant="destructive"
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          <Delete className="w-5 h-5" />
        </KeyButton>
      </div>
      
      {/* Letter Rows */}
      {KeyboardLayout.rows.slice(1).map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 mb-2 justify-center">
          {row.map(key => (
            <KeyButton key={key} onPress={() => onKeyPress(key)}>
              {key}
            </KeyButton>
          ))}
        </div>
      ))}
      
      {/* Bottom Row */}
      <div className="flex gap-2 mt-2">
        <KeyButton 
          onPress={onClear}
          variant="default"
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          CLEAR
        </KeyButton>
        <KeyButton 
          onPress={onSpace}
          className="flex-[3] bg-slate-700 hover:bg-slate-600 flex items-center justify-center gap-2"
        >
          <Space className="w-5 h-5" />
          <span>SPACE</span>
        </KeyButton>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
