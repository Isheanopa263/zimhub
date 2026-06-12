import { useState } from "react";
import PostAuthor from "./PostAuthor";
import PostActions from "./PostActions";
import TextPost from "./TextPost";
import ImagePost from "./ImagePost";
import VideoPost from "./VideoPost";
import LinkPost from "./LinkPost";
import CommentsDrawer from "../comments/CommentsDrawer";
import useLike from "../../hooks/useLike";

const PostCard = ({ post, onDelete }) => {
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

  const handleCommentCountChange = (newCountOrUpdater) => {
    if (typeof newCountOrUpdater === "function") {
      setCommentCount(newCountOrUpdater);
    } else {
      setCommentCount(newCountOrUpdater);
    }
  };

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
            {post.caption && <Caption text={post.caption} />}
            <ImagePost imageUrl={post.image?.url} caption={post.caption} />
          </div>
        );

      case "video":
        return (
          <div>
            {post.caption && <Caption text={post.caption} />}
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
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #f1f5f9",
          padding: "16px",
          marginBottom: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
        onCommentChange={handleCommentCountChange}
      />
    </>
  );
};

const Caption = ({ text }) => (
  <p
    style={{
      fontSize: "15px",
      color: "#0F172A",
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
