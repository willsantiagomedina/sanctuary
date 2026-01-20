import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Check,
  Trash2,
  Edit2,
  Copy,
  Globe,
  FileText,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  ScrollArea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@sanctuary/ui';
import { useEditorStore, Slide, SlideVariant, SlideElement } from '../../stores/editor';

// Variant labels
const VARIANT_LABELS = [
  { value: 'default', label: 'Default', icon: FileText },
  { value: 'short', label: 'Short', icon: FileText },
  { value: 'long', label: 'Long', icon: FileText },
  { value: 'bilingual', label: 'Bilingual', icon: Globe },
  { value: 'spanish', label: 'Spanish', icon: Globe },
  { value: 'japanese', label: 'Japanese', icon: Globe },
];

interface SlideVariantsDialogProps {
  slide: Slide | null;
  onUpdateSlide: (updates: Partial<Slide>) => void;
  onSwitchVariant: (variantId: string) => void;
}

export function SlideVariantsDialog({
  slide,
  onUpdateSlide,
  onSwitchVariant,
}: SlideVariantsDialogProps) {
  const { showVariantsDialog, setShowVariantsDialog } = useEditorStore();
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [newVariantLabel, setNewVariantLabel] = useState('');
  
  if (!slide) return null;
  
  const variants = slide.variants || [];
  const activeVariantId = slide.activeVariantId || 'default';
  
  // Create new variant from current slide
  const handleCreateVariant = (label: string) => {
    const newVariant: SlideVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label,
      elements: JSON.parse(JSON.stringify(slide.elements)), // Deep copy
    };
    
    onUpdateSlide({
      variants: [...variants, newVariant],
    });
    setNewVariantLabel('');
  };
  
  // Delete variant
  const handleDeleteVariant = (variantId: string) => {
    if (variantId === 'default') return;
    
    const newVariants = variants.filter(v => v.id !== variantId);
    onUpdateSlide({
      variants: newVariants,
      activeVariantId: activeVariantId === variantId ? 'default' : activeVariantId,
    });
  };
  
  // Switch to variant
  const handleSwitchVariant = (variantId: string) => {
    onSwitchVariant(variantId);
    setShowVariantsDialog(false);
  };
  
  // Rename variant
  const handleRenameVariant = (variantId: string, newLabel: string) => {
    const newVariants = variants.map(v =>
      v.id === variantId ? { ...v, label: newLabel } : v
    );
    onUpdateSlide({ variants: newVariants });
    setEditingVariant(null);
  };
  
  // Duplicate variant
  const handleDuplicateVariant = (variant: SlideVariant) => {
    const newVariant: SlideVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: `${variant.label} (Copy)`,
      elements: JSON.parse(JSON.stringify(variant.elements)),
    };
    
    onUpdateSlide({
      variants: [...variants, newVariant],
    });
  };
  
  return (
    <Dialog open={showVariantsDialog} onOpenChange={setShowVariantsDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Slide Variants
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground">
          Create different versions of this slide for different contexts (e.g., short, long, bilingual).
        </p>
        
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {/* Default variant (main slide) */}
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                activeVariantId === 'default' && 'border-primary bg-primary/5'
              )}
              onClick={() => handleSwitchVariant('default')}
            >
              <div className="w-16 h-12 rounded bg-slate-700 flex items-center justify-center text-xs text-white overflow-hidden">
                {slide.elements.length > 0 ? (
                  <span className="truncate px-1">
                    {slide.elements[0].content?.substring(0, 20)}
                  </span>
                ) : (
                  <FileText className="h-4 w-4 opacity-50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Default</span>
                  {activeVariantId === 'default' && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {slide.elements.length} element{slide.elements.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            {/* Custom variants */}
            {variants.map((variant) => {
              const isActive = activeVariantId === variant.id;
              const labelConfig = VARIANT_LABELS.find(l => l.value === variant.label.toLowerCase());
              
              return (
                <div
                  key={variant.id}
                  className={cn(
                    'group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    isActive && 'border-primary bg-primary/5'
                  )}
                  onClick={() => handleSwitchVariant(variant.id)}
                >
                  <div className="w-16 h-12 rounded bg-slate-700 flex items-center justify-center text-xs text-white overflow-hidden">
                    {variant.elements.length > 0 ? (
                      <span className="truncate px-1">
                        {variant.elements[0].content?.substring(0, 20)}
                      </span>
                    ) : (
                      <FileText className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingVariant === variant.id ? (
                      <Input
                        value={variant.label}
                        onChange={(e) => {
                          const newVariants = variants.map(v =>
                            v.id === variant.id ? { ...v, label: e.target.value } : v
                          );
                          onUpdateSlide({ variants: newVariants });
                        }}
                        onBlur={() => setEditingVariant(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingVariant(null)}
                        className="h-7 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{variant.label}</span>
                          {isActive && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {variant.elements.length} element{variant.elements.length !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVariant(variant.id);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateVariant(variant);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVariant(variant.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {/* Create new variant */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  Create Variant
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {VARIANT_LABELS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.value}
                      onClick={() => handleCreateVariant(item.label)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ScrollArea>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Switch variants instantly during live presentation
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Inline variant selector for slide filmstrip
interface VariantSelectorProps {
  slide: Slide;
  onSwitchVariant: (variantId: string) => void;
  compact?: boolean;
}

export function VariantSelector({ slide, onSwitchVariant, compact }: VariantSelectorProps) {
  const variants = slide.variants || [];
  const activeVariantId = slide.activeVariantId || 'default';
  
  if (variants.length === 0) return null;
  
  const activeLabel = activeVariantId === 'default'
    ? 'Default'
    : variants.find(v => v.id === activeVariantId)?.label || 'Default';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1', compact && 'h-6 px-2 text-xs')}
        >
          <Layers className={cn('h-3.5 w-3.5', compact && 'h-3 w-3')} />
          {!compact && <span className="max-w-[60px] truncate">{activeLabel}</span>}
          <ChevronDown className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => onSwitchVariant('default')}
          className={activeVariantId === 'default' ? 'bg-accent' : ''}
        >
          <FileText className="mr-2 h-4 w-4" />
          Default
          {activeVariantId === 'default' && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        {variants.map((variant) => (
          <DropdownMenuItem
            key={variant.id}
            onClick={() => onSwitchVariant(variant.id)}
            className={activeVariantId === variant.id ? 'bg-accent' : ''}
          >
            <Layers className="mr-2 h-4 w-4" />
            {variant.label}
            {activeVariantId === variant.id && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
