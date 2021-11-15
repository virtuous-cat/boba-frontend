import { setThreadInCache, setThreadPersonalIdentityInCache } from "./thread";

import { CommentType } from "types/Types";
import { QueryClient } from "react-query";

export const addCommentInCache = (
  queryClient: QueryClient,
  {
    threadId,
    boardId,
    newComments,
    replyTo,
  }: {
    threadId: string;
    boardId: string;
    newComments: CommentType[];
    replyTo: {
      postId: string;
      commentId: string | null;
    };
  }
) => {
  setThreadInCache(
    queryClient,
    {
      threadId,
      boardId,
    },
    {
      transformThread: (thread) => {
        return {
          ...thread,
          comments: {
            ...thread.comments,
            [replyTo.postId]: [
              ...(thread.comments[replyTo.postId] || []),
              ...newComments,
            ],
          },
          newCommentsAmount: thread.newPostsAmount + newComments.length,
          totalCommentsAmount: thread.totalPostsAmount + newComments.length,
        };
      },
      transformThreadSummary: (thread) => {
        return {
          ...thread,
          newPostsAmount:
            thread.newPostsAmount +
            newComments.reduce(
              (current, comment) => (current += comment.isNew ? 1 : 0),
              0
            ),
          totalCommentsAmount: thread.totalPostsAmount + newComments.length,
        };
      },
    }
  );
  if (newComments[0].isOwn) {
    setThreadPersonalIdentityInCache(queryClient, {
      boardId,
      threadId,
      personalIdentity: newComments[0].secretIdentity,
    });
  }
};
