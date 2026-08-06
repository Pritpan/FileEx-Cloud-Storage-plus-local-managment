export const MOCK_FILES = [
  {
    id: 1,
    name: 'Documents',
    type: 'folder',
    size: null,
    modifiedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Images',
    type: 'folder',
    size: null,
    modifiedAt: '2026-08-05T14:30:00Z',
  },
  {
    id: 3,
    name: 'Project Proposal.pdf',
    type: 'file',
    size: 1024 * 1024 * 2.5, // 2.5 MB
    modifiedAt: '2026-08-06T09:15:00Z',
  },
  {
    id: 4,
    name: 'Q3 Report.xlsx',
    type: 'file',
    size: 1024 * 512, // 512 KB
    modifiedAt: '2026-08-06T11:45:00Z',
  },
  {
    id: 5,
    name: 'presentation-draft.pptx',
    type: 'file',
    size: 1024 * 1024 * 15, // 15 MB
    modifiedAt: '2026-08-04T16:20:00Z',
  },
  {
    id: 6,
    name: 'logo-final.png',
    type: 'file',
    size: 1024 * 1024 * 1.2, // 1.2 MB
    modifiedAt: '2026-08-05T10:10:00Z',
  },
];

export const MOCK_BREADCRUMBS = [
  { id: 1, label: 'My Files' },
  { id: 2, label: 'Documents' },
  { id: 3, label: 'Work' }
];

export const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};
