import React from "react";
import {
  Layout as InnerLayout,
  // @ts-ignore
} from "@bobaboard/ui-components";
import LoginModal from "./LoginModal";
import SideMenu from "./SideMenu";
import { getBoardData } from "./../utils/queries";
import { useAuth } from "./Auth";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
// @ts-ignore
import { ReactQueryDevtools } from "react-query-devtools";

const Layout = (props: LayoutProps) => {
  const router = useRouter();
  const { isPending: isUserPending, user, isLoggedIn } = useAuth();
  const [loginOpen, setLoginOpen] = React.useState(false);

  const { data: boardData, isFetching: isFetchingBoardData } = useQuery(
    ["boardData", { slug: router.query.boardId?.slice(1) }],
    getBoardData,
    { staleTime: Infinity }
  );

  return (
    <div>
      <LoginModal
        isOpen={loginOpen}
        onCloseModal={() => setLoginOpen(false)}
        color={boardData?.settings.accentColor || "#f96680"}
      />
      <InnerLayout
        mainContent={props.mainContent}
        sideMenuContent={<SideMenu isLoggedIn={isLoggedIn} />}
        actionButton={props.actionButton}
        headerAccent={boardData?.settings.accentColor || "#f96680"}
        onUserBarClick={() => setLoginOpen(true)}
        user={user}
        title={props.title}
        onTitleClick={props.onTitleClick}
        loading={props.loading || isFetchingBoardData || isUserPending}
        onLogoClick={() => router.push("/")}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
};

export interface LayoutProps {
  mainContent: JSX.Element;
  actionButton?: JSX.Element;
  loading?: boolean;
  title: string;
  onTitleClick?: () => void;
}
export default Layout;