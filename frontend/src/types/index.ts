export interface Course {
  id: string;
  name: string;
  instructor: string;
  code: string;
  progress: number;
}

export interface Announcement {
  id: string;
  title: string;
  category: string;
  isUrgent: boolean;
  date: string;
}
