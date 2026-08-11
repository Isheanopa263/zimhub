import { useState, useEffect } from "react";
import PostAuthor from "./PostAuthor";
import PostActions from "./PostActions";
import TextPost from "./TextPost";
import ImagePost from "./ImagePost";
import VideoPost from "./VideoPost";
import LinkPost from "./LinkPost";
import HeartBurst from "./HeartBurst";
import CommentsDrawer from "../comments/CommentsDrawer";
import useLike from "../../hooks/useLike";
import useDoubleTap from "../../hooks/useDoubleTap";
import MarkdownText from "../ui/MarkdownText";
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
    setIsLiked,
    setLikeCount,
  } = useLike(post.isLiked || false, post.stats?.likes || 0);

  /* Sync comment count when post prop updates */
  useEffect(() => {
    setCommentCount(post.stats?.comments || 0);
  }, [post.id, post.stats?.comments]);

  /* Sync like state when post prop updates */
  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikeCount(post.stats?.likes || 0);
  }, [post.id, post.isLiked, post.stats?.likes, setIsLiked, setLikeCount]);

  const handleLike = () => toggleLike(post.id);

  /**
   * Double-tap only LIKES (never unlikes)
   * Prevents accidental unlikes
   */
  const handleDoubleTap = () => {
    if (likeLoading) return;
    if (!isLiked) {
      toggleLike(post.id);
    }
  };

  const { bursts, handlers } = useDoubleTap(handleDoubleTap);

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
            <ImagePost
              images={post.images}
              imageUrl={post.image?.url}
              caption={post.caption}
            />
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

        <div
          {...handlers}
          style={{
            position: "relative",
            marginBottom: "4px",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            cursor: "pointer",
          }}
        >
          {renderContent()}

          {bursts.map((burst) => (
            <HeartBurst key={burst.id} id={burst.id} x={burst.x} y={burst.y} />
          ))}
        </div>

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
  <div style={{ marginBottom: "10px" }}>
    <MarkdownText variant="default">{text}</MarkdownText>
  </div>
);

export default PostCard;
