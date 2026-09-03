import { ExplorerItem } from './ExplorerItem';

/**
 * ExplorerGrid — grid layout for cloud file/folder items.
 */
export function ExplorerGrid({
  items, onRename, onMove, onDelete, onProperties,
  onDoubleClick, onPreview, onDownload, onDropItem,
  selectedItem, onItemClick,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', padding: '16px' }}>
      {items.map((item) => (
        <ExplorerItem
          key={item.id}
          item={item}
          isSelected={selectedItem?.id === item.id}
          onItemClick={onItemClick}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onProperties={onProperties}
          onDoubleClick={onDoubleClick}
          onPreview={onPreview}
          onDownload={onDownload}
          onDropItem={onDropItem}
        />
      ))}
    </div>
  );
}
