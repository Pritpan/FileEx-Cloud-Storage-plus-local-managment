import { ExplorerItem } from './ExplorerItem';

/**
 * ExplorerGrid — grid layout for file/folder items.
 *
 * @param {{ items, onRename, onMove, onDelete }} props
 */
export function ExplorerGrid({ items, onRename, onMove, onDelete, onProperties, onDoubleClick, onPreview, onDownload }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
      {items.map((item) => (
        <ExplorerItem
          key={item.id}
          item={item}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onProperties={onProperties}
          onDoubleClick={onDoubleClick}
          onPreview={onPreview}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
