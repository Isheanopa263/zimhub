import { useState } from "react";
import PostAuthor from "./PostAuthor";
import PostActions from "./PostActions";
import TextPost from "./TextPost";
import ImagePost from "./ImagePost";
import VideoPost from "./VideoPost";
import LinkPost from "./LinkPost";
import CommentsDrawer from "../comments/CommentsDrawer";
import useLike from "../../hooks/useLike";
import useTheme from "../../hooks/useTheme";

const PostCard = ({ post, onDelete }) => {
  const { c } = useTheme();
  if (!post) return null;

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.stats?.comments || 0);

  const {
    isLiked,
    likeCount,
    loading: likeLoading,
    toggleLike,
  } = useLike(post.isLiked || false, post.stats?.likes || 0);

  const handleLike = () => toggleLike(post.id);

  const renderContent = () => {
    switch (post.type) {
      case "text":
        return (
          <TextPost
            content={post.text?.content || ""}
            backgroundStyle={post.text?.backgroundStyle || "default"}
          />
        );
      case "image":
        return (
          <div>
            {post.caption && <Caption text={post.caption} c={c} />}
            <ImagePost imageUrl={post.image?.url} caption={post.caption} />
          </div>
        );
      case "video":
        return (
          <div>
            {post.caption && <Caption text={post.caption} c={c} />}
            <VideoPost
              videoUrl={post.video?.url}
              thumbnailUrl={post.video?.thumbnailUrl}
            />
          </div>
        );
      case "link":
        return (
          <LinkPost
            url={post.link?.url}
            title={post.link?.title}
            description={post.link?.description}
            ogImage={post.link?.ogImage}
            caption={post.caption}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <article
        style={{
          background: c.bgCard,
          borderRadius: "16px",
          border: `1px solid ${c.border}`,
          padding: "16px",
          marginBottom: "12px",
          boxShadow: c.shadowSm,
        }}
      >
        <PostAuthor author={post.author} createdAt={post.createdAt} />

        <div style={{ marginBottom: "4px" }}>{renderContent()}</div>

        <PostActions
          post={post}
          isLiked={isLiked}
          likeCount={likeCount}
          commentCount={commentCount}
          onLike={handleLike}
          onComment={() => setCommentsOpen(true)}
          onDelete={onDelete}
          likeLoading={likeLoading}
        />
      </article>

      <CommentsDrawer
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        onCommentChange={setCommentCount}
      />
    </>
  );
};

const Caption = ({ text, c }) => (
  <p
    style={{
      fontSize: "15px",
      color: c.text,
      marginTop: 0,
      marginBottom: "10px",
      lineHeight: 1.55,
      fontFamily: "Inter, sans-serif",
      wordBreak: "break-word",
    }}
  >
    {text}
  </p>
);

export default PostCard;
