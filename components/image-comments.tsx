"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface ImageCommentsProps {
  comments: Comment[];
  newComment: string;
  onCommentChange: (value: string) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export default function ImageComments({
  comments,
  newComment,
  onCommentChange,
  onCommentSubmit,
  className = ""
}: ImageCommentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  return (
    <div className={`flex-1 flex flex-col ${className}`}>
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 border-b border-border last:border-b-0">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {comment.author[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                </div>
                <p className="text-sm text-foreground">{comment.text}</p>
              </div>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Comment Form */}
      <form onSubmit={onCommentSubmit} className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 p-3 border-0 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="text-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-600 transition-colors"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}