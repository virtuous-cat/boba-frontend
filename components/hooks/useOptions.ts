import { PostData, PostPermissions, PostType } from "types/Types";
import {
  faBookOpen,
  faBug,
  faCodeBranch,
  faEdit,
  faEye,
  faEyeSlash,
  faFilm,
  faImages,
  faLink,
  faReply,
  faVolumeMute,
  faVolumeUp,
} from "@fortawesome/free-solid-svg-icons";
import {
  useMuteThread,
  useReadThread,
  useSetThreadHidden,
  useSetThreadView,
} from "queries/thread";

import { DropdownProps } from "@bobaboard/ui-components/dist/common/DropdownListMenu";
import { EditorActions } from "components/editors/types";
import { LinkWithAction } from "@bobaboard/ui-components/dist/types";
import React from "react";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { toast } from "@bobaboard/ui-components";
import { useAuth } from "components/Auth";
import { useBoardMetadata } from "queries/board";
import { useCachedLinks } from "./useCachedLinks";
import { useEditorsDispatch } from "components/editors/EditorsContext";
import { useInvalidateNotifications } from "queries/notifications";

export enum PostOptions {
  COPY_LINK = "COPY_LINK",
  COPY_THREAD_LINK = "COPY_THREAD_LINK",
  EDIT_TAGS = "EDIT_TAGS",
  MARK_READ = "MARK_READ",
  MUTE = "MUTE",
  HIDE = "HIDE",
  UPDATE_VIEW = "UPDATE_VIEW",
  OPEN_AS = "OPEN_AS",
  DEBUG = "DEBUG",
}

enum DebugOptions {
  COPY_CONTENT_DATA = "COPY_CONTENT_DATA",
  COPY_POST_ID = "COPY_POST_ID",
}

const isPostEditPermission = (postPermission: PostPermissions) => {
  return [
    PostPermissions.editContent,
    PostPermissions.editWhisperTags,
    PostPermissions.editCategoryTags,
    PostPermissions.editWhisperTags,
    PostPermissions.editContentNotices,
  ].includes(postPermission);
};

const copyText = (text: string) => {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
};

const getCopyLinkOption = (href: string, text: string) => ({
  icon: faLink,
  name: text,
  link: {
    onClick: () => {
      copyText(new URL(href, window.location.origin).toString());

      toast.success("Link copied!");
    },
  },
});

const getEditTagsOption = (callback: () => void) => ({
  icon: faEdit,
  name: "Edit tags",
  link: {
    onClick: callback,
  },
});

const getMarkReadOption = (callback: () => void) => ({
  icon: faBookOpen,
  name: "Mark read",
  link: {
    onClick: callback,
  },
});

const getMuteThreadOption = (
  muted: boolean,
  callback: (muted: boolean) => void
) => ({
  icon: muted ? faVolumeUp : faVolumeMute,
  name: muted ? "Unmute thread" : "Mute thread",
  link: {
    onClick: () => callback(!muted),
  },
});

const getHideThreadOption = (
  hidden: boolean,
  callback: (hidden: boolean) => void
) => ({
  icon: hidden ? faEye : faEyeSlash,
  name: hidden ? "Unhide thread" : "Hide thread",
  link: {
    onClick: () => callback(!hidden),
  },
});

const getUpdateViewOption = (
  currentView: PostData["defaultView"],
  callback: (updatedView: PostData["defaultView"]) => void
) => ({
  icon: faEdit,
  name: "Change default view",
  options: [
    {
      icon: faCodeBranch,
      name: "Thread",
      link: {
        onClick: () => callback("thread"),
      },
    },
    {
      icon: faImages,
      name: "Gallery",
      link: {
        onClick: () => callback("gallery"),
      },
    },
    {
      icon: faFilm,
      name: "Timeline",
      link: {
        onClick: () => callback("timeline"),
      },
    },
  ].filter((option) => option.name.toLowerCase() != currentView),
});

const getDebugOption = (callback: (debugOption: DebugOptions) => void) => ({
  icon: faBug,
  name: "Debug",
  options: [
    {
      icon: faCopy,
      name: "Copy content data",
      link: {
        onClick: () => callback(DebugOptions.COPY_CONTENT_DATA),
      },
    },
    {
      icon: faCopy,
      name: "Copy post id",
      link: {
        onClick: () => callback(DebugOptions.COPY_POST_ID),
      },
    },
  ],
});

const getOpenAsOptions = (
  getLink: (view: PostData["defaultView"]) => LinkWithAction
) => ({
  icon: faReply,
  name: "Open as",
  options: [
    {
      icon: faCodeBranch,
      name: "Thread",
      link: getLink("thread"),
    },
    {
      icon: faImages,
      name: "Gallery",
      link: getLink("gallery"),
    },
    {
      icon: faFilm,
      name: "Timeline",
      link: getLink("timeline"),
    },
  ],
});

const usePostOptions = ({
  options,
  data: { threadId, boardId, post, ...data },
}: {
  options: PostOptions[];
  isLoggedIn: boolean;
  data: {
    boardId: string | null;
    threadId: string;
    post: PostType | undefined;
    currentView: PostData["defaultView"];
    hidden?: boolean;
    muted?: boolean;
  };
}): DropdownProps["options"] => {
  const { getLinkToPost, getLinkToThread } = useCachedLinks();
  const { isLoggedIn } = useAuth();
  const editorDispatch = useEditorsDispatch();
  const readThread = useReadThread();
  const hideThread = useSetThreadHidden();
  const muteThread = useMuteThread();
  const setThreadView = useSetThreadView();
  const { boardMetadata } = useBoardMetadata({ boardId });
  const refetchNotifications = useInvalidateNotifications();

  const editTagsCallback = React.useCallback(() => {
    if (!boardMetadata || !post?.postId) {
      return;
    }
    editorDispatch({
      type: EditorActions.EDIT_TAGS,
      payload: {
        boardId: boardMetadata.id,
        contributionId: post.postId,
        threadId: threadId,
      },
    });
  }, [boardMetadata, post?.postId, threadId, editorDispatch]);

  const markReadCallback = React.useCallback(() => {
    if (!boardId) {
      return;
    }
    readThread(
      {
        threadId,
        boardId,
      },
      {
        onSuccess: () => {
          refetchNotifications();
        },
      }
    );
  }, [threadId, boardId, readThread, refetchNotifications]);

  const hideThreadCallback = React.useCallback(
    (hide: boolean) => {
      if (!boardId) {
        return;
      }
      hideThread(
        {
          threadId,
          boardId,
          hide,
        },
        {
          onSuccess: () => {
            refetchNotifications();
          },
        }
      );
    },
    [threadId, boardId, hideThread, refetchNotifications]
  );

  const muteThreadCallback = React.useCallback(
    (mute: boolean) => {
      if (!boardId) {
        return;
      }
      muteThread(
        {
          threadId,
          boardId,
          mute,
        },
        {
          onSuccess: () => {
            refetchNotifications();
          },
        }
      );
    },
    [threadId, boardId, muteThread, refetchNotifications]
  );

  const setThreadViewCallback = React.useCallback(
    (view: PostData["defaultView"]) => {
      if (!boardId) {
        return;
      }
      setThreadView({
        threadId,
        boardId,
        view,
      });
    },
    [setThreadView, threadId, boardId]
  );

  const getOption = React.useCallback(
    (option: PostOptions) => {
      if (!boardMetadata || !post) {
        return;
      }
      switch (option) {
        case PostOptions.COPY_LINK:
          return getCopyLinkOption(
            getLinkToPost({
              slug: boardMetadata.slug,
              postId: post.postId,
              threadId: threadId,
            })?.href as string,
            "Copy link"
          );
        case PostOptions.COPY_THREAD_LINK:
          return getCopyLinkOption(
            getLinkToThread({
              slug: boardMetadata.slug,
              threadId: threadId,
            })?.href as string,
            "Copy thread link"
          );
        case PostOptions.HIDE:
          if (!isLoggedIn || data.hidden == undefined) {
            return null;
          }
          return getHideThreadOption(data.hidden, hideThreadCallback);
        case PostOptions.MUTE:
          if (!isLoggedIn || data.muted == undefined) {
            return null;
          }
          return getMuteThreadOption(data.muted, muteThreadCallback);
        case PostOptions.MARK_READ:
          if (!isLoggedIn) {
            return null;
          }
          return getMarkReadOption(markReadCallback);
        case PostOptions.UPDATE_VIEW:
          if (!isLoggedIn || !post.isOwn) {
            return null;
          }
          return getUpdateViewOption(data.currentView, setThreadViewCallback);
        case PostOptions.EDIT_TAGS:
          if (
            !isLoggedIn ||
            (!post.isOwn &&
              !boardMetadata?.permissions?.postPermissions.some(
                isPostEditPermission
              ))
          ) {
            return null;
          }
          return getEditTagsOption(editTagsCallback);
        case PostOptions.OPEN_AS:
          return getOpenAsOptions((view) =>
            getLinkToThread({
              slug: boardMetadata.slug,
              threadId: threadId,
              view,
            })
          );
        case PostOptions.DEBUG:
          return getDebugOption((option) => {
            switch (option) {
              case DebugOptions.COPY_CONTENT_DATA:
                copyText(post.content);
                break;
              case DebugOptions.COPY_POST_ID:
                copyText(post.postId);
                break;
              default:
                throw new Error("Unrecognized debug option");
            }
            toast.success("Copied!");
          });
      }
    },
    [
      isLoggedIn,
      post,
      threadId,
      boardMetadata,
      editTagsCallback,
      getLinkToPost,
      getLinkToThread,
      hideThreadCallback,
      markReadCallback,
      muteThreadCallback,
      setThreadViewCallback,
      data.hidden,
      data.muted,
      data.currentView,
    ]
  );

  const dropdownOptions = React.useMemo(() => {
    return options.map(getOption).filter((option) => option != null);
  }, [options, getOption]);

  return dropdownOptions as DropdownProps["options"];
};

export { usePostOptions };
