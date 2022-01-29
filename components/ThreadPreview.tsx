import { Post, TagType, TagsType } from "@bobaboard/ui-components";
import { PostData, ThreadSummaryType } from "types/Types";
import { PostOptions, usePostOptions } from "./options/usePostOptions";
import {
  faCodeBranch,
  faFilm,
  faFilter,
  faImages,
} from "@fortawesome/free-solid-svg-icons";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import noop from "noop-ts";
import { useCachedLinks } from "./hooks/useCachedLinks";
import { useForceHideIdentity } from "./hooks/useForceHideIdentity";
import { useRealmBoardId } from "contexts/RealmContext";
import { useSetThreadHidden } from "queries/thread";
import { withEditors } from "./editors/withEditors";

const THREAD_OPTIONS = [
  PostOptions.COPY_THREAD_LINK,
  PostOptions.MARK_READ,
  PostOptions.MUTE,
  PostOptions.HIDE,
  PostOptions.OPEN_AS,
  PostOptions.EDIT_TAGS,
  PostOptions.UPDATE_VIEW,
  PostOptions.DEBUG,
];

const getThreadTypeIcon = (view: PostData["defaultView"]) => {
  switch (view) {
    case "gallery":
      return faImages;
    case "thread":
      return faCodeBranch;
    case "timeline":
      return faFilm;
  }
};

const HiddenThread: React.FC<{
  thread: ThreadSummaryType;
}> = ({ thread }) => {
  const setThreadHidden = useSetThreadHidden();
  return (
    <div className="post hidden" key={thread.id}>
      This thread was hidden{" "}
      <a
        href="#"
        onClick={(e) => {
          setThreadHidden({
            threadId: thread.id,
            boardId: thread.parentBoardId,
            hide: !thread.hidden,
          });
          e.preventDefault();
        }}
      >
        [unhide]
      </a>
      <style jsx>{`
        .post.hidden {
          margin: 0 auto;
          max-width: 500px;
          width: calc(100% - 40px);
          background-color: gray;
          padding: 20px;
          border: 1px dashed black;
          border-radius: 15px;
        }
      `}</style>
    </div>
  );
};

const ThreadPreview: React.FC<{
  thread: ThreadSummaryType;
  isLoggedIn: boolean;
  originBoard?: {
    slug: string;
    accentColor: string;
  };
  onSetCategoryFilter?: (filter: string) => void;
}> = ({ thread, isLoggedIn, onSetCategoryFilter, originBoard }) => {
  const { getLinkToThread } = useCachedLinks();
  const hasReplies =
    thread.totalPostsAmount > 1 || thread.totalCommentsAmount > 0;
  const linkToThread = getLinkToThread({
    slug: thread.parentBoardSlug,
    threadId: thread.id,
  });
  const rootPost = thread.starter;
  const boardId = useRealmBoardId({
    boardSlug: thread.parentBoardSlug,
    realmSlug: "v0",
  });
  const options = usePostOptions({
    options: THREAD_OPTIONS,
    isLoggedIn,
    data: {
      boardId,
      threadId: thread.id,
      post: rootPost,
      currentView: thread.defaultView,
      muted: thread.muted,
      hidden: thread.hidden,
    },
  });
  const { forceHideIdentity } = useForceHideIdentity();

  const tagOptions = React.useCallback(
    (tag: TagsType) => {
      if (tag.type == TagType.CATEGORY && onSetCategoryFilter) {
        return [
          {
            icon: faFilter,
            name: "Filter",
            link: {
              onClick: () => {
                onSetCategoryFilter(tag.name);
              },
            },
          },
        ];
      }
      return undefined;
    },
    [onSetCategoryFilter]
  );

  if (thread.hidden) {
    return <HiddenThread thread={thread} />;
  }

  return (
    <Post
      key={rootPost.postId}
      createdTime={`${formatDistanceToNow(new Date(rootPost.created), {
        addSuffix: true,
      })}${
        hasReplies
          ? ` [updated: ${formatDistanceToNow(new Date(thread.lastActivityAt), {
              addSuffix: true,
            })}]`
          : ""
      }`}
      createdMessageIcon={getThreadTypeIcon(thread.defaultView)}
      createdTimeLink={linkToThread}
      text={rootPost.content}
      tags={rootPost.tags}
      secretIdentity={rootPost.secretIdentity}
      userIdentity={rootPost.userIdentity}
      onNewContribution={noop}
      onNewComment={noop}
      newPost={isLoggedIn && !thread.muted && thread.new}
      newComments={
        isLoggedIn ? (thread.muted ? undefined : thread.newCommentsAmount) : 0
      }
      newContributions={
        isLoggedIn
          ? thread.muted
            ? undefined
            : thread.newPostsAmount - (thread.new ? 1 : 0)
          : 0
      }
      totalComments={thread.totalCommentsAmount}
      // subtract 1 since posts_amount is the amount of posts total in the thread
      // including the head one.
      totalContributions={thread.totalPostsAmount - 1}
      directContributions={thread.directThreadsAmount}
      notesLink={linkToThread}
      muted={isLoggedIn && thread.muted}
      menuOptions={options}
      getOptionsForTag={tagOptions}
      board={originBoard}
      forceHideIdentity={forceHideIdentity}
    />
  );
};

export default withEditors(ThreadPreview);
