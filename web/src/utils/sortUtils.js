export function sortFiles(files, sortBy, direction) {
  if (!files || files.length === 0) return [];

  const folders = [];
  const items = [];

  for (const f of files) {
    if (f.type === 'FOLDER') folders.push(f);
    else items.push(f);
  }

  const sortFn = (a, b) => {
    let result = 0;
    
    if (sortBy === 'name') {
      const nameA = (a.displayName || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.name || '').toLowerCase();
      result = nameA.localeCompare(nameB);
    } 
    else if (sortBy === 'size') {
      const sizeA = a._local?.size ?? a.size ?? 0;
      const sizeB = b._local?.size ?? b.size ?? 0;
      result = sizeA - sizeB;
    }
    else if (sortBy === 'type') {
      const getExt = (name) => {
        const parts = name.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
      }
      const typeA = a.mimeType || getExt(a.displayName || a.name || '');
      const typeB = b.mimeType || getExt(b.displayName || b.name || '');
      result = typeA.localeCompare(typeB);
      if (result === 0) {
        result = (a.displayName || '').localeCompare(b.displayName || '');
      }
    }
    else if (sortBy === 'modified') {
      const getModified = (item) => {
        if (item._local?.modifiedAt) return new Date(item._local.modifiedAt).getTime();
        if (item.updatedAt) return new Date(item.updatedAt).getTime();
        if (item.createdAt) return new Date(item.createdAt).getTime();
        return 0;
      };
      result = getModified(a) - getModified(b);
    }

    return direction === 'desc' ? -result : result;
  };

  folders.sort(sortFn);
  items.sort(sortFn);

  return [...folders, ...items];
}
