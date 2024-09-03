import express from 'express';
import { verifyUser } from '../middlewear/verifyUser.js';
import { handleWriteNewComment, handleGetPostComments, handleLikeComment, handleDislikeComment, handleGetAllPostsComments, handleDeletePostComment } from '../controllers/commentController.js';


const router = express.Router();

router.get('/', handleGetAllPostsComments)

router.get('/:postId', handleGetPostComments);

router.post('/:postId/:userId', verifyUser, handleWriteNewComment);

router.put('/like/:commentId', verifyUser, handleLikeComment);

router.put('/dislike/:commentId', verifyUser, handleDislikeComment);

router.delete('/delete/:commentId', verifyUser, handleDeletePostComment)

export default router;