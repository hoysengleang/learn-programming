export type PostRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tag: string;
  color: string;
  is_pinned: boolean;
  created_at: Date;
  updated_at: Date;
};

export type PublicPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  tag: string;
  color: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePostInput = {
  title?: string;
  content?: string;
  tag?: string;
  color?: string;
  isPinned?: boolean;
};

export type UpdatePostInput = Partial<CreatePostInput>;
