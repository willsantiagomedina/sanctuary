import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Ruler,
  Eye,
  Type,
  Image,
  Square,
  Circle,
  BookOpen,
  Music,
  Plus,
  Trash2,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Group,
  Ungroup,
  Lock,
  Unlock,
  Keyboard,
  HelpCircle,
  MessageSquare,
  Play,
  ChevronRight,
  Triangle,
  Star,
  Hexagon,
  Settings,
  MonitorPlay,
} from 'lucide-react';
import { cn, Separator } from '@sanctuary/ui';

export interface EditorCommand {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  disabled?: boolean;
  checked?: boolean;
}

export interface MenuSection {
  items: EditorCommand[];
}

export interface EditorMenuBarProps {
  // File operations
  onNew: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onExportPDF: () => void;
  onExportPPTX: () => void;
  onPrint: () => void;
  
  // Edit operations
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  
  // View operations
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  showSpeakerNotes: boolean;
  onToggleSpeakerNotes: () => void;
  onFullscreen: () => void;
  onPresent: () => void;
  onPresenterView: () => void;
  
  // Insert operations
  onInsertText: () => void;
  onInsertImage: () => void;
  onInsertShape: (shape: string) => void;
  onInsertVerse: () => void;
  onInsertSong: () => void;
  onInsertSlide: () => void;
  onChangeBackground: () => void;
  
  // Slide operations
  onNewSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onSkipSlide: () => void;
  canDeleteSlide: boolean;
  
  // Arrange operations
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
  onDistributeH: () => void;
  onDistributeV: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onLock: () => void;
  onUnlock: () => void;
  
  // Help
  onShowShortcuts: () => void;
  onShowHelp: () => void;
}

// Menu item component
function MenuItem({ 
  command, 
  onClose 
}: { 
  command: EditorCommand; 
  onClose: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors",
        command.disabled 
          ? "text-muted-foreground cursor-not-allowed" 
          : "hover:bg-muted"
      )}
      onClick={() => {
        if (!command.disabled) {
          command.action();
          onClose();
        }
      }}
      disabled={command.disabled}
    >
      {command.icon && <command.icon className="h-4 w-4" />}
      <span className="flex-1 text-left">{command.label}</span>
      {command.shortcut && (
        <span className="text-xs text-muted-foreground">{command.shortcut}</span>
      )}
      {command.checked !== undefined && (
        <span className={cn("w-4 h-4 flex items-center justify-center", command.checked && "text-primary")}>
          {command.checked && "✓"}
        </span>
      )}
    </button>
  );
}

// Submenu component
function SubMenu({ 
  label, 
  icon: Icon, 
  items, 
  onClose 
}: { 
  label: string; 
  icon?: React.ComponentType<{ className?: string }>;
  items: EditorCommand[];
  onClose: () => void;
}) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowSubmenu(true)}
      onMouseLeave={() => setShowSubmenu(false)}
    >
      <button className="w-full flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-muted">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight className="h-4 w-4" />
      </button>
      
      {showSubmenu && (
        <div className="absolute left-full top-0 ml-1 w-48 rounded-lg border border-border/60 bg-popover/95 shadow-lg p-1 z-50">
          {items.map((item, idx) => (
            <MenuItem key={idx} command={item} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

// Dropdown Menu component
function DropdownMenu({ 
  label, 
  sections, 
  isOpen, 
  onOpen,
  onClose,
  submenus,
}: { 
  label: string;
  sections: MenuSection[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  submenus?: { label: string; icon?: React.ComponentType<{ className?: string }>; items: EditorCommand[] }[];
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => onOpen()}
      onMouseLeave={() => onClose()}
    >
      <button
        className={cn(
          "px-3 py-1.5 text-sm rounded-md transition-colors",
          isOpen ? "bg-muted" : "hover:bg-muted/70"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            onClose();
          } else {
            onOpen();
          }
        }}
      >
        {label}
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-border/60 bg-popover/95 shadow-xl p-1 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {sIdx > 0 && <Separator className="my-1" />}
              {section.items.map((item, iIdx) => (
                <MenuItem key={iIdx} command={item} onClose={onClose} />
              ))}
            </div>
          ))}
          {submenus && submenus.length > 0 && (
            <>
              <Separator className="my-1" />
              {submenus.map((submenu, idx) => (
                <SubMenu 
                  key={idx} 
                  label={submenu.label} 
                  icon={submenu.icon}
                  items={submenu.items} 
                  onClose={onClose}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function EditorMenuBar(props: EditorMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  
  const closeMenu = useCallback(() => setOpenMenu(null), []);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenu]);
  
  // File menu
  const fileMenu: MenuSection[] = [
    {
      items: [
        { id: 'new', label: 'New presentation', shortcut: '⌘N', icon: FileText, action: props.onNew },
        { id: 'duplicate', label: 'Duplicate', shortcut: '⌘⇧D', icon: Copy, action: props.onDuplicate },
        { id: 'rename', label: 'Rename...', icon: Settings, action: props.onRename },
      ],
    },
    {
      items: [
        { id: 'export-pdf', label: 'Export as PDF', icon: Download, action: props.onExportPDF },
        { id: 'export-pptx', label: 'Export as PPTX', icon: Download, action: props.onExportPPTX },
      ],
    },
    {
      items: [
        { id: 'print', label: 'Print', shortcut: '⌘P', icon: Printer, action: props.onPrint },
      ],
    },
  ];
  
  // Edit menu
  const editMenu: MenuSection[] = [
    {
      items: [
        { id: 'undo', label: 'Undo', shortcut: '⌘Z', icon: Undo2, action: props.onUndo, disabled: !props.canUndo },
        { id: 'redo', label: 'Redo', shortcut: '⌘⇧Z', icon: Redo2, action: props.onRedo, disabled: !props.canRedo },
      ],
    },
    {
      items: [
        { id: 'cut', label: 'Cut', shortcut: '⌘X', icon: Scissors, action: props.onCut, disabled: !props.hasSelection },
        { id: 'copy', label: 'Copy', shortcut: '⌘C', icon: Copy, action: props.onCopy, disabled: !props.hasSelection },
        { id: 'paste', label: 'Paste', shortcut: '⌘V', icon: ClipboardPaste, action: props.onPaste },
      ],
    },
    {
      items: [
        { id: 'select-all', label: 'Select all', shortcut: '⌘A', icon: MousePointer2, action: props.onSelectAll },
      ],
    },
  ];
  
  // View menu
  const viewMenu: MenuSection[] = [
    {
      items: [
        { id: 'zoom-in', label: 'Zoom in', shortcut: '⌘+', icon: ZoomIn, action: props.onZoomIn },
        { id: 'zoom-out', label: 'Zoom out', shortcut: '⌘-', icon: ZoomOut, action: props.onZoomOut },
        { id: 'reset-zoom', label: `Reset zoom (${props.zoom}%)`, icon: Eye, action: props.onResetZoom },
      ],
    },
    {
      items: [
        { id: 'grid', label: 'Show grid', icon: Grid3X3, action: props.onToggleGrid, checked: props.showGrid },
        { id: 'rulers', label: 'Show rulers', icon: Ruler, action: props.onToggleRulers, checked: props.showRulers },
        { id: 'snap-grid', label: 'Snap to grid', icon: MousePointer2, action: props.onToggleSnapToGrid, checked: props.snapToGrid },
        { id: 'notes', label: 'Show speaker notes', icon: MessageSquare, action: props.onToggleSpeakerNotes, checked: props.showSpeakerNotes },
      ],
    },
    {
      items: [
        { id: 'fullscreen', label: 'Fullscreen', shortcut: 'F11', icon: Maximize, action: props.onFullscreen },
        { id: 'present', label: 'Start presentation', shortcut: '⌘Enter', icon: Play, action: props.onPresent },
        { id: 'presenter-view', label: 'Presenter view', icon: MonitorPlay, action: props.onPresenterView },
      ],
    },
  ];
  
  // Insert menu
  const insertMenu: MenuSection[] = [
    {
      items: [
        { id: 'text', label: 'Text box', shortcut: 'T', icon: Type, action: props.onInsertText },
        { id: 'image', label: 'Image', shortcut: 'I', icon: Image, action: props.onInsertImage },
        { id: 'verse', label: 'Bible verse', shortcut: 'V', icon: BookOpen, action: props.onInsertVerse },
        { id: 'song', label: 'Song lyrics', shortcut: 'S', icon: Music, action: props.onInsertSong },
      ],
    },
    {
      items: [
        { id: 'slide', label: 'New slide', shortcut: '⌘M', icon: Plus, action: props.onInsertSlide },
        { id: 'background', label: 'Change background', icon: Layers, action: props.onChangeBackground },
      ],
    },
  ];
  
  // Shape submenu items
  const shapeSubmenus = [
    {
      label: 'Shape',
      icon: Square,
      items: [
        { id: 'rect', label: 'Rectangle', icon: Square, action: () => props.onInsertShape('rectangle') },
        { id: 'circle', label: 'Circle', icon: Circle, action: () => props.onInsertShape('circle') },
        { id: 'triangle', label: 'Triangle', icon: Triangle, action: () => props.onInsertShape('triangle') },
        { id: 'star', label: 'Star', icon: Star, action: () => props.onInsertShape('star') },
        { id: 'hexagon', label: 'Hexagon', icon: Hexagon, action: () => props.onInsertShape('hexagon') },
      ],
    },
  ];
  
  // Slide menu
  const slideMenu: MenuSection[] = [
    {
      items: [
        { id: 'new-slide', label: 'New slide', shortcut: '⌘M', icon: Plus, action: props.onNewSlide },
        { id: 'dup-slide', label: 'Duplicate slide', shortcut: '⌘D', icon: Copy, action: props.onDuplicateSlide },
        { id: 'del-slide', label: 'Delete slide', icon: Trash2, action: props.onDeleteSlide, disabled: !props.canDeleteSlide },
      ],
    },
    {
      items: [
        { id: 'skip-slide', label: 'Skip slide', icon: Eye, action: props.onSkipSlide },
      ],
    },
    {
      items: [
        { id: 'background', label: 'Change background', icon: Layers, action: props.onChangeBackground },
      ],
    },
  ];
  
  // Arrange menu
  const arrangeMenu: MenuSection[] = [
    {
      items: [
        { id: 'bring-forward', label: 'Bring forward', shortcut: '⌘]', icon: ArrowUp, action: props.onBringForward, disabled: !props.hasSelection },
        { id: 'send-backward', label: 'Send backward', shortcut: '⌘[', icon: ArrowDown, action: props.onSendBackward, disabled: !props.hasSelection },
        { id: 'bring-front', label: 'Bring to front', shortcut: '⌘⇧]', icon: ArrowUpToLine, action: props.onBringToFront, disabled: !props.hasSelection },
        { id: 'send-back', label: 'Send to back', shortcut: '⌘⇧[', icon: ArrowDownToLine, action: props.onSendToBack, disabled: !props.hasSelection },
      ],
    },
    {
      items: [
        { id: 'align-left', label: 'Align left', icon: AlignLeft, action: props.onAlignLeft, disabled: !props.hasSelection },
        { id: 'align-center', label: 'Align center', icon: AlignCenter, action: props.onAlignCenter, disabled: !props.hasSelection },
        { id: 'align-right', label: 'Align right', icon: AlignRight, action: props.onAlignRight, disabled: !props.hasSelection },
      ],
    },
    {
      items: [
        { id: 'distribute-h', label: 'Distribute horizontally', icon: AlignHorizontalDistributeCenter, action: props.onDistributeH, disabled: !props.hasSelection },
        { id: 'distribute-v', label: 'Distribute vertically', icon: AlignVerticalDistributeCenter, action: props.onDistributeV, disabled: !props.hasSelection },
      ],
    },
    {
      items: [
        { id: 'group', label: 'Group', shortcut: '⌘G', icon: Group, action: props.onGroup, disabled: !props.hasSelection },
        { id: 'ungroup', label: 'Ungroup', shortcut: '⌘⇧G', icon: Ungroup, action: props.onUngroup, disabled: !props.hasSelection },
        { id: 'lock', label: 'Lock', icon: Lock, action: props.onLock, disabled: !props.hasSelection },
        { id: 'unlock', label: 'Unlock', icon: Unlock, action: props.onUnlock, disabled: !props.hasSelection },
      ],
    },
  ];
  
  // Help menu
  const helpMenu: MenuSection[] = [
    {
      items: [
        { id: 'shortcuts', label: 'Keyboard shortcuts', shortcut: '⌘/', icon: Keyboard, action: props.onShowShortcuts },
        { id: 'help', label: 'Help & documentation', icon: HelpCircle, action: props.onShowHelp },
      ],
    },
    {
      items: [
        { id: 'feedback', label: 'Send feedback', icon: MessageSquare, action: () => {} },
      ],
    },
  ];

  return (
    <div 
      ref={menuBarRef}
      className="flex items-center gap-0.5 px-2"
    >
      <DropdownMenu
        label="File"
        sections={fileMenu}
        isOpen={openMenu === 'file'}
        onOpen={() => setOpenMenu('file')}
        onClose={closeMenu}
      />
      <DropdownMenu
        label="Edit"
        sections={editMenu}
        isOpen={openMenu === 'edit'}
        onOpen={() => setOpenMenu('edit')}
        onClose={closeMenu}
      />
      <DropdownMenu
        label="View"
        sections={viewMenu}
        isOpen={openMenu === 'view'}
        onOpen={() => setOpenMenu('view')}
        onClose={closeMenu}
      />
      <DropdownMenu
        label="Insert"
        sections={insertMenu}
        submenus={shapeSubmenus}
        isOpen={openMenu === 'insert'}
        onOpen={() => setOpenMenu('insert')}
        onClose={closeMenu}
      />
      <DropdownMenu
        label="Slide"
        sections={slideMenu}
        isOpen={openMenu === 'slide'}
        onOpen={() => setOpenMenu('slide')}
        onClose={closeMenu}
      />
      <DropdownMenu
        label="Arrange"
        sections={arrangeMenu}
        isOpen={openMenu === 'arrange'}
        onOpen={() => setOpenMenu('arrange')}
        onClose={closeMenu}
      />
      <DropdownMenu
        label="Help"
        sections={helpMenu}
        isOpen={openMenu === 'help'}
        onOpen={() => setOpenMenu('help')}
        onClose={closeMenu}
      />
    </div>
  );
}
