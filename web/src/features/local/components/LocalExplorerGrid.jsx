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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
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
