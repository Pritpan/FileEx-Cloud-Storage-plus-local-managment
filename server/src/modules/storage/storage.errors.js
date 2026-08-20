export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageConfigurationError extends StorageError {
  constructor(message) {
    super(message);
    this.name = 'StorageConfigurationError';
  }
}

export class ObjectNotFoundError extends StorageError {
  constructor(message = 'The expected S3 object does not exist.') {
    super(message);
    this.name = 'ObjectNotFoundError';
  }
}

export class UploadFailedError extends StorageError {
  constructor(message = 'The S3 upload operation failed.') {
    super(message);
    this.name = 'UploadFailedError';
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(message = 'The storage service is currently unavailable.') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}
