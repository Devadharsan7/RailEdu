// Minimal storage implementation for compatibility
export interface Batch {
  id: string;
  name: string;
  createdAt: string;
}

export interface Notification {
  id?: string;
  title?: string;
  message: string;
  type: string;
  read?: boolean;
  createdAt?: string;
}

// Batch storage
export const batchStorage = {
  getAll: (): Batch[] => [],
  save: (batch: Batch) => {},
  delete: (id: string) => {},
  getById: (id: string): Batch | null => null
};

// Notification storage
export const notificationStorage = {
  getAll: (): Notification[] => [],
  save: (notification: Notification) => {},
  add: (notification: Notification) => {}, // Alias for save for backward compatibility
  delete: (id: string) => {},
  markAsRead: (id: string) => {},
  getUnreadCount: (): number => 0
};

// Reschedule storage
export const rescheduleStorage = {
  getAll: () => [],
  save: (data: any) => {},
  delete: (id: string) => {}
};