import React, { useState } from 'react';
import {
  Palette,
  Plus,
  Check,
  Trash2,
  Edit2,
  BookOpen,
  Type,
  Music,
  AlignLeft,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  ScrollArea,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  cn,
} from '@sanctuary/ui';
import { useEditorStore, StylePreset, SlideElement } from '../../stores/editor';

// Category icons and labels
const CATEGORIES = {
  verse: { icon: BookOpen, label: 'Scripture Verse', color: 'text-amber-500' },
  title: { icon: Type, label: 'Title', color: 'text-blue-500' },
  chorus: { icon: Music, label: 'Chorus', color: 'text-purple-500' },
  caption: { icon: AlignLeft, label: 'Caption', color: 'text-green-500' },
  body: { icon: FileText, label: 'Body Text', color: 'text-slate-500' },
  custom: { icon: Palette, label: 'Custom', color: 'text-pink-500' },
};

interface StylePresetsDialogProps {
  onApplyPreset?: (style: Partial<SlideElement['style']>) => void;
  currentStyle?: Partial<SlideElement['style']>;
}

export function StylePresetsDialog({ onApplyPreset, currentStyle }: StylePresetsDialogProps) {
  const {
    showPresetsDialog,
    setShowPresetsDialog,
    stylePresets,
    addStylePreset,
    removeStylePreset,
    updateStylePreset,
  } = useEditorStore();
  
  const [activeTab, setActiveTab] = useState<string>('all');
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPresetCategory, setNewPresetCategory] = useState<StylePreset['category']>('custom');
  
  // Filter presets by category
  const filteredPresets = activeTab === 'all' 
    ? stylePresets 
    : stylePresets.filter(p => p.category === activeTab);
  
  // Apply preset
  const handleApply = (preset: StylePreset) => {
    if (onApplyPreset) {
      onApplyPreset(preset.style);
    }
    setShowPresetsDialog(false);
  };
  
  // Create new preset from current style
  const handleCreatePreset = () => {
    if (!newPresetName.trim() || !currentStyle) return;
    
    addStylePreset({
      name: newPresetName,
      category: newPresetCategory,
      style: currentStyle,
    });
    
    setNewPresetName('');
    setShowCreateForm(false);
  };
  
  // Delete preset
  const handleDelete = (id: string) => {
    removeStylePreset(id);
  };
  
  // Rename preset
  const handleRename = (id: string, name: string) => {
    updateStylePreset(id, { name });
    setEditingPreset(null);
  };
  
  return (
    <Dialog open={showPresetsDialog} onOpenChange={setShowPresetsDialog}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Style Presets
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="h-[400px] mt-4">
            <div className="grid grid-cols-2 gap-3 pr-4">
              {filteredPresets.map((preset) => {
                const category = CATEGORIES[preset.category] || CATEGORIES.custom;
                const Icon = category.icon;
                
                return (
                  <div
                    key={preset.id}
                    className={cn(
                      'group relative p-4 border rounded-lg hover:border-primary/50 transition-all cursor-pointer',
                      preset.isDefault && 'bg-muted/30'
                    )}
                    onClick={() => handleApply(preset)}
                  >
                    {/* Preview */}
                    <div
                      className="mb-3 p-3 rounded bg-slate-800 min-h-[60px] flex items-center justify-center"
                    >
                      <span
                        style={{
                          fontFamily: preset.style.fontFamily || 'Inter',
                          fontSize: `${Math.min(preset.style.fontSize || 24, 20)}px`,
                          fontWeight: preset.style.fontWeight || '400',
                          color: preset.style.color || '#ffffff',
                          textAlign: preset.style.textAlign || 'center',
                        }}
                        className="line-clamp-2"
                      >
                        {preset.name}
                      </span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingPreset === preset.id ? (
                          <Input
                            value={preset.name}
                            onChange={(e) => updateStylePreset(preset.id, { name: e.target.value })}
                            onBlur={() => setEditingPreset(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingPreset(null)}
                            className="h-7 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h4 className="font-medium text-sm truncate">{preset.name}</h4>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Icon className={cn('h-3 w-3', category.color)} />
                          <span className="text-xs text-muted-foreground">
                            {category.label}
                          </span>
                          {preset.isDefault && (
                            <span className="text-xs text-muted-foreground ml-1">• Default</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      {!preset.isDefault && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPreset(preset.id);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(preset.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Apply indicator */}
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                        <Check className="h-4 w-4" />
                        Apply
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Create new preset card */}
              {currentStyle && (
                <div
                  className="p-4 border border-dashed rounded-lg hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Save Current Style
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
        
        {/* Create form */}
        {showCreateForm && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Create New Preset</h4>
              <Input
                placeholder="Preset name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
                  <Button
                    key={key}
                    variant={newPresetCategory === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewPresetCategory(key as StylePreset['category'])}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePreset} disabled={!newPresetName.trim()}>
                  Create Preset
                </Button>
              </div>
            </div>
          </>
        )}
        
        {/* Keyboard hint */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded">⌘⇧S</kbd> to open presets
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick preset picker (inline)
interface QuickPresetPickerProps {
  onSelect: (style: Partial<SlideElement['style']>) => void;
  category?: StylePreset['category'];
}

export function QuickPresetPicker({ onSelect, category }: QuickPresetPickerProps) {
  const { stylePresets } = useEditorStore();
  
  const presets = category 
    ? stylePresets.filter(p => p.category === category)
    : stylePresets.filter(p => p.isDefault);
  
  return (
    <div className="flex flex-wrap gap-1">
      {presets.slice(0, 5).map((preset) => (
        <Button
          key={preset.id}
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onSelect(preset.style)}
        >
          {preset.name}
        </Button>
      ))}
    </div>
  );
}
