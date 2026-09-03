/**
 * LocalExplorerGrid.jsx — grid wrapper for LocalExplorerItem
 *
 * Passes selection state and local-specific action callbacks down
 * to each LocalExplorerItem. Does NOT use the shared ExplorerGrid /
 * ExplorerItem because those have cloud-specific context menus.
 */

import { LocalExplorerItem } from './LocalExplorerItem';

export function LocalExplorerGrid({
  items,
  selectedId,
  onSelect,
  onOpen,
  onUploadToCloud,
  onCopy,
  onCut,
  onRename,
  onDelete,
  onProperties,
  onDropItem,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', padding: '16px' }}>
      {items.map((item) => (
        <LocalExplorerItem
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={onSelect}
          onOpen={onOpen}
          onUploadToCloud={onUploadToCloud}
          onCopy={onCopy}
          onCut={onCut}
          onRename={onRename}
          onDelete={onDelete}
          onProperties={onProperties}
          onDropItem={onDropItem}
        />
      ))}
    </div>
  );
}
