import { Comment } from "../models/commentModel.js";
import { User } from "../models/userModel.js";

export async function handleGetAllPostsComments(req,res) {
  try {
    const allPostscomments = await Comment.find();

    if(!allPostscomments || allPostscomments.length === 0){
      return res.status(404).send("No post comments found!")
    }

    res.status(200).json({
      comments: allPostscomments
    })
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Something went wrong while fetching comments." });
  }
}


export async function handleGetPostComments(req, res) {
  const { postId } = req.params;

  try {
    if (!postId || postId.trim() === "") {
      return res.status(400).json({ error: "Invalid postId." });
    }

    const postComments = await Comment.find({ postId });

    if (!postComments || postComments.length === 0) {
      return res
        .status(200)
        .json({ message: "No comments yet for this post." });
    }

    const commentsWithUserDetails = await Promise.all(
      postComments.map(async (comment) => {
        const user = await User.findById(comment.userId);
        return {
          comment,
          user: user
            ? {
                id: user._id,
                name: user.username,
                userImage: user.profilePicture,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      comments: commentsWithUserDetails,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Something went wrong while fetching post comments." });
  }
}


export async function handleWriteNewComment(req, res) {
  const { postId, userId } = req.params;
  const { content } = req.body;

  if (req.valideUser && req.valideUser._id.toString() === userId.toString()) {
    try {
      if (!content || content.trim() === "") {
        return res.status(400).json({ error: "Comment content is required." });
      }

      const newComment = await Comment.create({
        content,
        postId,
        userId,
      });

      return res
        .status(200)
        .json({ message: "Comment posted successfully.", comment: newComment });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Server error while posting the comment." });
    }
  } else {
    return res
      .status(403)
      .json({ error: "You are not authorized to post this comment." });
  }
}


export async function handleLikeComment(req, res) {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (
    !commentId ||
    !userId ||
    commentId.toString() === "" ||
    userId.toString() === ""
  ) {
    return res.status(404).send("Invalid request.");
  }

  if (req.valideUser && req.valideUser._id.toString() === userId.toString()) {
    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).send("Comment not found.");
      }

      const alreadyLiked = comment.likes.includes(userId);

      if (alreadyLiked) {
        comment.likes = comment.likes.filter(
          (id) => id.toString() !== userId.toString()
        );
      } else {
        comment.likes.push(userId);
      }

      await comment.save();

      return res.status(200).json({
        likes: comment.likes.length,
      });
    } catch (error) {
      console.error("Error liking the comment:", error);
      return res.status(500).send("Server error while liking the comment.");
    }
  } else {
    return res.status(401).send("Unauthorized to like this comment.");
  }
}


export async function handleDislikeComment(req, res) {
    const { commentId } = req.params;
    const { userId } = req.body;
    console.log(commentId, userId, req.valideUser)

    if (req.valideUser && req.valideUser._id.toString() === userId.toString()) {
      try {
        const comment = await Comment.findById(commentId);
  
        if (!comment) {
          return res.status(404).send("Comment not found.");
        }
  
        const alreadyDisliked = comment.dislikes.includes(userId);
  
        if (alreadyDisliked) {
          comment.dislikes = comment.dislikes.filter(
            (id) => id.toString() !== userId.toString()
          );
        } else {
          comment.dislikes.push(userId);
        }
  
        await comment.save();
  
        return res.status(200).json({
          dislikes: comment.dislikes.length,
        });
      } catch (error) {
        console.error("Error disliking the comment:", error);
        return res.status(500).send("Server error while disliking the comment.");
      }
    } else {
      return res.status(401).send("Unauthorized to dislike this comment.");
    }
}
  

export async function handleDeletePostComment(req,res) {
  if(req.valideUser && req.valideUser.isAdmin){
    const { commentId } = req.params;

    if(!commentId){
      return res.status(403).send("Invalid request ....");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if(!deletedComment){
      return res.status(404).send("No comment found with this id..");
    }

    return res.status(200).send("Comment deleted")
  }else{
    return res.status(401).send("Unauthorized to delete a comment.");
  }
}