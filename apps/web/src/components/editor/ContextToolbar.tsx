import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  Trash2,
  Copy,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Link,
  Crop,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@sanctuary/ui';
import { SlideElement } from '../../stores/editor';
import { FONT_FAMILIES, TEXT_COLORS } from '../../data/fonts';

interface ContextToolbarProps {
  element: SlideElement | null;
  elements: SlideElement[];
  onUpdateStyle: (updates: Partial<SlideElement['style']>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLock: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  containerRef: React.RefObject<HTMLElement>;
  zoom: number;
}

// Floating toolbar that appears above selected element
export function ContextToolbar({
  element,
  elements,
  onUpdateStyle,
  onDelete,
  onDuplicate,
  onLock,
  onBringForward,
  onSendBackward,
  containerRef,
  zoom,
}: ContextToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  
  // Calculate toolbar position based on element
  useEffect(() => {
    if (!element || !containerRef.current || !toolbarRef.current) {
      setVisible(false);
      return;
    }
    
    const scale = zoom / 100;
    const container = containerRef.current.getBoundingClientRect();
    const toolbar = toolbarRef.current.getBoundingClientRect();
    
    // Position above the element
    const elementTop = element.y * scale;
    const elementLeft = element.x * scale;
    const elementWidth = element.width * scale;
    
    let top = elementTop - toolbar.height - 12;
    let left = elementLeft + (elementWidth / 2) - (toolbar.width / 2);
    
    // Keep within container bounds
    if (top < 0) {
      // Position below element instead
      top = elementTop + (element.height * scale) + 12;
    }
    
    left = Math.max(8, Math.min(left, container.width - toolbar.width - 8));
    
    setPosition({ top, left });
    setVisible(true);
  }, [element, zoom, containerRef]);
  
  if (!element) return null;
  
  const isText = element.type === 'text' || element.type === 'verse';
  const isImage = element.type === 'image';
  const isShape = element.type === 'shape';
  
  return (
    <div
      ref={toolbarRef}
      className={cn(
        'absolute z-50 flex items-center gap-1 px-2 py-1.5 bg-popover border rounded-lg shadow-lg transition-all duration-150',
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      )}
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Text formatting tools */}
      {isText && (
        <>
          {/* Font family */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1">
                <Type className="h-3.5 w-3.5" />
                <span className="max-w-[80px] truncate">
                  {element.style.fontFamily || 'Inter'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1 max-h-60 overflow-auto">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => onUpdateStyle({ fontFamily: font.value })}
                    className={cn(
                      'w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors',
                      element.style.fontFamily === font.value && 'bg-accent'
                    )}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Bold/Italic/Underline */}
          <ToolbarButton
            icon={Bold}
            tooltip="Bold (⌘B)"
            active={element.style.fontWeight === 'bold' || element.style.fontWeight === '700'}
            onClick={() => onUpdateStyle({ 
              fontWeight: element.style.fontWeight === 'bold' || element.style.fontWeight === '700' ? '400' : 'bold' 
            })}
          />
          <ToolbarButton
            icon={Italic}
            tooltip="Italic (⌘I)"
            active={false} // Would need fontStyle in element
            onClick={() => {}}
          />
          <ToolbarButton
            icon={Underline}
            tooltip="Underline (⌘U)"
            active={false} // Would need textDecoration in element
            onClick={() => {}}
          />
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Text alignment */}
          <ToolbarButton
            icon={AlignLeft}
            tooltip="Align Left"
            active={element.style.textAlign === 'left'}
            onClick={() => onUpdateStyle({ textAlign: 'left' })}
          />
          <ToolbarButton
            icon={AlignCenter}
            tooltip="Align Center"
            active={element.style.textAlign === 'center'}
            onClick={() => onUpdateStyle({ textAlign: 'center' })}
          />
          <ToolbarButton
            icon={AlignRight}
            tooltip="Align Right"
            active={element.style.textAlign === 'right'}
            onClick={() => onUpdateStyle({ textAlign: 'right' })}
          />
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Text color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: element.style.color || '#ffffff' }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="grid grid-cols-6 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateStyle({ color })}
                    className={cn(
                      'w-6 h-6 rounded border hover:scale-110 transition-transform',
                      element.style.color === color && 'ring-2 ring-primary ring-offset-1'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
      
      {/* Image tools */}
      {isImage && (
        <>
          <ToolbarButton
            icon={Crop}
            tooltip="Crop"
            onClick={() => {}}
          />
          <ToolbarButton
            icon={FlipHorizontal}
            tooltip="Flip Horizontal"
            onClick={() => {}}
          />
          <ToolbarButton
            icon={FlipVertical}
            tooltip="Flip Vertical"
            onClick={() => {}}
          />
          <Separator orientation="vertical" className="h-6" />
        </>
      )}
      
      {/* Shape tools */}
      {isShape && (
        <>
          {/* Fill color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1">
                <Palette className="h-3.5 w-3.5" />
                <span>Fill</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="grid grid-cols-6 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateStyle({ backgroundColor: color })}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}
      
      {/* Common tools */}
      <ToolbarButton
        icon={element.locked ? Lock : Unlock}
        tooltip={element.locked ? 'Unlock' : 'Lock'}
        active={element.locked}
        onClick={onLock}
      />
      
      <ToolbarButton
        icon={Copy}
        tooltip="Duplicate (⌘D)"
        onClick={onDuplicate}
      />
      
      <ToolbarButton
        icon={Trash2}
        tooltip="Delete (⌫)"
        onClick={onDelete}
        destructive
      />
      
      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onBringForward}>
            <ArrowUp className="mr-2 h-4 w-4" />
            Bring Forward
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSendBackward}>
            <ArrowDown className="mr-2 h-4 w-4" />
            Send Backward
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Toolbar button component
interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  active?: boolean;
  onClick: () => void;
  destructive?: boolean;
}

function ToolbarButton({ icon: Icon, tooltip, active, onClick, destructive }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 w-8 p-0',
            active && 'bg-accent',
            destructive && 'hover:bg-destructive hover:text-destructive-foreground'
          )}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

// Multi-select toolbar
interface MultiSelectToolbarProps {
  elementIds: string[];
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
  onDistributeH: () => void;
  onDistributeV: () => void;
  onGroup: () => void;
  onDelete: () => void;
}

export function MultiSelectToolbar({
  elementIds,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  onDistributeH,
  onDistributeV,
  onGroup,
  onDelete,
}: MultiSelectToolbarProps) {
  if (elementIds.length < 2) return null;
  
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-popover border rounded-lg shadow-lg">
      <span className="text-xs text-muted-foreground px-2">
        {elementIds.length} selected
      </span>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Alignment */}
      <ToolbarButton icon={AlignLeft} tooltip="Align Left" onClick={onAlignLeft} />
      <ToolbarButton icon={AlignCenter} tooltip="Align Center" onClick={onAlignCenter} />
      <ToolbarButton icon={AlignRight} tooltip="Align Right" onClick={onAlignRight} />
      
      <Separator orientation="vertical" className="h-6" />
      
      <ToolbarButton icon={Trash2} tooltip="Delete All" onClick={onDelete} destructive />
    </div>
  );
}
