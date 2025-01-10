import { Post } from "../models/postModel.js";
import path from "path";
import { Comment } from "../models/commentModel.js";
import { Log } from "../models/activityLogModel.js";

const uploadDir = path.resolve("./public/uploads/");

export async function handleGetAllPosts(req, res) {
  try {
    const { page = 1, dashBoard = 0 } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = 12;
    let posts = null;

    if (dashBoard == "1") {
      posts = await Post.find();
    } else {
      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).send("Invalid page number.");
      }

      const skip = (pageNumber - 1) * pageSize;

      posts = await Post.find().skip(skip).limit(pageSize);
    }

    if (!posts.length) {
      return res.status(404).send("No posts found.");
    }

    const categories = await Post.distinct("category");

    res.status(200).json({
      posts,
      categories,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).send("Error in fetching all posts.");
  }
}

export async function handleCreateNewPosts(req, res) {
  const { title, category, content, postImage } = req.body;

  if (!req.valideUser.isAdmin) {
    return res.status(401).send("You are not allowed to create post");
  }

  if (!title || !content) {
    return res.status(404).send("Please provide all required fields..");
  }

  if (req.valideUser.isAdmin) {
    try {
      // const postImage = req.file && `/uploads/${req.file.filename}`;
      const slug = title
        .split(" ")
        .join("-")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, "");

      const newPost = await Post.create({
        title,
        content,
        postImage,
        category,
        slug,
        createdByUser: req.valideUser._id,
      });

      console.log("new post ", newPost);

      try {
        await Log.create({
          details: `${req.valideUser.username} created a post`,
          user: req.valideUser._id,
        });
      } catch (logError) {
        console.error("Failed to create activity log:", logError.message);
      }

      return res.status(200).json({
        post: newPost,
      });
    } catch (error) {
      return res.status(500).send("Error in creating a new post");
    }
  }
}

export async function handleGetPostById(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("Post ID is required.");
  }

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).send("No post found.");
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in fetching the post:", error);
    return res.status(500).send("Error in fetching the post");
  }
}

export async function handleUpdatePost(req, res) {
  console.log(req.params.postId);
  const { title, category, content, postImage } = req.body;

  if (!req.valideUser.isAdmin) {
    return res.status(401).send("You are not allowed to update this post");
  }

  if (!title || !category || !content) {
    return res.status(400).send("Please provide all required fields.");
  }

  try {
    const postDetails = await Post.findById(req.params.postId);

    if (!postDetails) {
      return res.status(404).send("Post not found.");
    }

    const slug = title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    // const postPicture = req.file
    //   ? `/uploads/${req.file.filename}`
    //   : postDetails.postImage;

    // if (req.file && req.file.filename) {
    //   const previousImagePath = path.join(
    //     uploadDir,
    //     path.basename(postDetails.postImage)
    //   );

    // try {
    //   if (postDetails.postImage && fs.existsSync(previousImagePath)) {
    //     fs.unlinkSync(previousImagePath);
    //   }
    // } catch (err) {
    //   console.error("Error deleting the previous image:", err);
    //   return res.status(500).send("Error updating the post");
    // }
    // }

    postDetails.title = title;
    postDetails.category = category;
    postDetails.content = content;
    postDetails.postImage = postImage;
    postDetails.slug = slug;
    postDetails.createdByUser = req.valideUser._id;

    await postDetails.save({ validateBeforeSave: false });

    return res.status(200).json({
      post: postDetails,
    });
  } catch (error) {
    console.error("Error in updating the post:", error);
    return res.status(500).send("Error in updating the post");
  }
}

export async function handleDeletePost(req, res) {
  if (!req.valideUser.isAdmin) {
    return res.status(401).send("You are not allowed to delete the post");
  }

  const { postId } = req.params;

  if (!postId) {
    return res.status(400).send("Post ID is required.");
  }

  try {
    const postDetails = await Post.findById(postId);

    if (!postDetails) {
      return res.status(404).send("Post not found.");
    }

    // const postImageToDelete = path.join(uploadDir, path.basename(postDetails.postImage));

    // if (postDetails.postImage && fs.existsSync(postImageToDelete)) {
    //   fs.unlinkSync(postImageToDelete);
    // }

    const deletedComments = await Comment.deleteMany({
      postId: postDetails._id,
    });
    console.log("Deleted comments count:", deletedComments.deletedCount);

    await Post.findByIdAndDelete(postDetails._id);

    return res
      .status(200)
      .send("Post and associated comments deleted successfully.");
  } catch (error) {
    console.error("Error in deleting the post:", error);
    return res.status(500).send("Error in deleting the post");
  }
}
