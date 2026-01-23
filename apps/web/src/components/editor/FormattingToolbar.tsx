import { useRef } from 'react';
import {
  Undo2,
  Redo2,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Minus,
  Plus,
  Palette,
  Image,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Lock,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Play,
  Upload,
  Link,
} from 'lucide-react';
import { 
  cn, 
  Button, 
  Separator, 
  Popover, 
  PopoverContent, 
  PopoverTrigger,
  ScrollArea,
  Input,
  Slider,
  Label,
} from '@sanctuary/ui';
import { FONT_FAMILIES, FONT_SIZES, TEXT_COLORS, BACKGROUND_COLORS } from '../../data/fonts';

export interface FormattingToolbarProps {
  // Selection state
  selectedElementType: 'text' | 'image' | 'shape' | 'verse' | null;
  selectedElementId: string | null;
  
  // Current styles
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  borderRadius?: number;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  
  // Text formatting
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onBoldToggle: () => void;
  onItalicToggle: () => void;
  onUnderlineToggle: () => void;
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void;
  onTextColorChange: (color: string) => void;
  
  // Object formatting
  onFillColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  onBorderRadiusChange: (radius: number) => void;
  
  // Arrange
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  
  // Element actions
  onDuplicate: () => void;
  onDelete: () => void;
  onLock: () => void;
  
  // Image specific
  onImageUpload: (file: File) => void;
  onImageUrlInsert: (url: string) => void;
  
  // Zoom & Present
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPresent: () => void;
}

// Color swatch button
function ColorSwatch({ 
  color, 
  isSelected, 
  onClick,
  size = 'md',
}: { 
  color: string; 
  isSelected: boolean; 
  onClick: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      className={cn(
        "rounded border-2 transition-all hover:scale-110",
        size === 'sm' ? "w-5 h-5" : "w-6 h-6",
        isSelected 
          ? "border-primary ring-2 ring-primary/30" 
          : "border-transparent hover:border-border"
      )}
      style={{ backgroundColor: color }}
      onClick={onClick}
    />
  );
}

// Toolbar button
function ToolbarButton({ 
  icon: Icon, 
  label, 
  onClick, 
  active, 
  disabled,
  shortcut,
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={disabled}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// Image upload dialog content
function ImageUploadContent({ 
  onUpload, 
  onUrlInsert,
  onClose,
}: { 
  onUpload: (file: File) => void;
  onUrlInsert: (url: string) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      onClose();
    }
  };
  
  const handleUrlSubmit = () => {
    const url = urlInputRef.current?.value;
    if (url) {
      onUrlInsert(url);
      onClose();
    }
  };
  
  return (
    <div className="w-72 space-y-4">
      <div>
        <Label className="text-sm font-medium">Upload from computer</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button 
          variant="outline" 
          className="w-full mt-2 justify-start"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose file...
        </Button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-popover px-2 text-muted-foreground">or</span>
        </div>
      </div>
      
      <div>
        <Label className="text-sm font-medium">Insert from URL</Label>
        <div className="flex gap-2 mt-2">
          <Input
            ref={urlInputRef}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
          />
          <Button onClick={handleUrlSubmit}>
            <Link className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FormattingToolbar(props: FormattingToolbarProps) {
  const {
    selectedElementType,
    selectedElementId,
    fontFamily = 'Instrument Sans',
    fontSize = 24,
    fontWeight = '400',
    textAlign = 'center',
    color = '#ffffff',
    backgroundColor,
    opacity = 1,
    borderRadius = 0,
    canUndo,
    canRedo,
    zoom,
  } = props;
  
  const isBold = fontWeight === '700';
  const hasSelection = !!selectedElementId;
  
  return (
    <div className="h-11 border-b bg-card/80 backdrop-blur-sm flex items-center px-3 gap-1">
      {/* History controls - always visible */}
      <ToolbarButton
        icon={Undo2}
        label="Undo"
        shortcut="⌘Z"
        onClick={props.onUndo}
        disabled={!canUndo}
      />
      <ToolbarButton
        icon={Redo2}
        label="Redo"
        shortcut="⌘⇧Z"
        onClick={props.onRedo}
        disabled={!canRedo}
      />
      
      <Separator orientation="vertical" className="h-6 mx-2" />
      
      {/* Text formatting - visible when text/verse selected */}
      {(selectedElementType === 'text' || selectedElementType === 'verse') && (
        <>
          {/* Font family */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 text-sm rounded-md hover:bg-accent/50 min-w-[100px] max-w-[140px]">
                <span className="truncate" style={{ fontFamily }}>{fontFamily}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1" align="start">
              <ScrollArea className="h-64">
                {FONT_FAMILIES.map(font => (
                  <button
                    key={font.value}
                    className={cn(
                      "w-full px-2 py-1.5 text-left text-sm rounded-md transition-colors",
                      fontFamily === font.value ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    style={{ fontFamily: font.value }}
                    onClick={() => props.onFontFamilyChange(font.value)}
                  >
                    {font.name}
                  </button>
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          
          {/* Font size */}
          <div className="flex items-center">
            <button 
              className="h-8 w-6 flex items-center justify-center rounded-l-md hover:bg-accent/50"
              onClick={() => props.onFontSizeChange(Math.max(8, fontSize - 2))}
            >
              <Minus className="h-3 w-3" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-8 px-2 flex items-center gap-1 text-sm hover:bg-accent/50 border-x">
                  <span className="w-6 text-center">{fontSize}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-20 p-1" align="start">
                <ScrollArea className="h-48">
                  {FONT_SIZES.map(size => (
                    <button
                      key={size}
                      className={cn(
                        "w-full px-2 py-1 text-center text-sm rounded-md",
                        fontSize === size ? "bg-accent" : "hover:bg-accent/50"
                      )}
                      onClick={() => props.onFontSizeChange(size)}
                    >
                      {size}
                    </button>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <button 
              className="h-8 w-6 flex items-center justify-center rounded-r-md hover:bg-accent/50"
              onClick={() => props.onFontSizeChange(Math.min(128, fontSize + 2))}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Bold, Italic, Underline */}
          <ToolbarButton
            icon={Bold}
            label="Bold"
            shortcut="⌘B"
            onClick={props.onBoldToggle}
            active={isBold}
          />
          <ToolbarButton
            icon={Italic}
            label="Italic"
            shortcut="⌘I"
            onClick={props.onItalicToggle}
          />
          <ToolbarButton
            icon={Underline}
            label="Underline"
            shortcut="⌘U"
            onClick={props.onUnderlineToggle}
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Text alignment */}
          <ToolbarButton
            icon={AlignLeft}
            label="Align left"
            onClick={() => props.onTextAlignChange('left')}
            active={textAlign === 'left'}
          />
          <ToolbarButton
            icon={AlignCenter}
            label="Align center"
            onClick={() => props.onTextAlignChange('center')}
            active={textAlign === 'center'}
          />
          <ToolbarButton
            icon={AlignRight}
            label="Align right"
            onClick={() => props.onTextAlignChange('right')}
            active={textAlign === 'right'}
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Text color */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 rounded-md hover:bg-accent/50">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <Label className="text-xs text-muted-foreground mb-2 block">Text Color</Label>
              <div className="grid grid-cols-6 gap-1.5">
                {TEXT_COLORS.map(c => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    isSelected={color === c}
                    onClick={() => props.onTextColorChange(c)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
      
      {/* Image controls - visible when image selected */}
      {selectedElementType === 'image' && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Image className="h-4 w-4 mr-2" />
                Replace Image
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto" align="start">
              <ImageUploadContent
                onUpload={props.onImageUpload}
                onUrlInsert={props.onImageUrlInsert}
                onClose={() => {}}
              />
            </PopoverContent>
          </Popover>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Opacity slider */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Opacity</Label>
            <Slider
              value={[opacity * 100]}
              min={0}
              max={100}
              step={5}
              className="w-24"
              onValueChange={([v]) => props.onOpacityChange(v / 100)}
            />
            <span className="text-xs w-8">{Math.round(opacity * 100)}%</span>
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Border radius */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Corners</Label>
            <Input
              type="number"
              value={borderRadius}
              onChange={(e) => props.onBorderRadiusChange(Number(e.target.value))}
              className="w-16 h-7 text-xs"
              min={0}
              max={100}
            />
          </div>
        </>
      )}
      
      {/* Shape controls - visible when shape selected */}
      {selectedElementType === 'shape' && (
        <>
          {/* Fill color */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 rounded-md hover:bg-accent/50">
                <Palette className="h-4 w-4" />
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: backgroundColor || '#ffffff' }} />
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <Label className="text-xs text-muted-foreground mb-2 block">Fill Color</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {BACKGROUND_COLORS.map(c => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    isSelected={backgroundColor === c}
                    onClick={() => props.onFillColorChange(c)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Opacity */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Opacity</Label>
            <Slider
              value={[opacity * 100]}
              min={0}
              max={100}
              step={5}
              className="w-24"
              onValueChange={([v]) => props.onOpacityChange(v / 100)}
            />
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Border radius */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Corners</Label>
            <Input
              type="number"
              value={borderRadius}
              onChange={(e) => props.onBorderRadiusChange(Number(e.target.value))}
              className="w-16 h-7 text-xs"
              min={0}
              max={100}
            />
          </div>
        </>
      )}
      
      {/* Arrange controls - visible when any element selected */}
      {hasSelection && (
        <>
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 text-sm rounded-md hover:bg-accent/50">
                <ArrowUp className="h-4 w-4" />
                Order
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="start">
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                onClick={props.onBringForward}
              >
                <ArrowUp className="h-4 w-4" />
                Bring forward
              </button>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                onClick={props.onSendBackward}
              >
                <ArrowDown className="h-4 w-4" />
                Send backward
              </button>
              <Separator className="my-1" />
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                onClick={props.onBringToFront}
              >
                <ArrowUpToLine className="h-4 w-4" />
                Bring to front
              </button>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                onClick={props.onSendToBack}
              >
                <ArrowDownToLine className="h-4 w-4" />
                Send to back
              </button>
            </PopoverContent>
          </Popover>
          
          <ToolbarButton
            icon={Copy}
            label="Duplicate"
            shortcut="⌘D"
            onClick={props.onDuplicate}
          />
          <ToolbarButton
            icon={Lock}
            label="Lock"
            onClick={props.onLock}
          />
          <ToolbarButton
            icon={Trash2}
            label="Delete"
            shortcut="Del"
            onClick={props.onDelete}
          />
        </>
      )}
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Zoom controls */}
      <div className="flex items-center gap-1 bg-muted rounded-md px-1">
        <button 
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent/50"
          onClick={props.onZoomOut}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs w-12 text-center">{zoom}%</span>
        <button 
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent/50"
          onClick={props.onZoomIn}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>
      
      <Separator orientation="vertical" className="h-6 mx-2" />
      
      {/* Present button */}
      <Button onClick={props.onPresent} size="sm" className="shadow-sm">
        <Play className="h-4 w-4 mr-1.5" />
        Present
      </Button>
    </div>
  );
}
