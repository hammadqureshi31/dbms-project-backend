import express from 'express'
import { handleCreateNewPosts, handleDeletePost, handleGetAllPosts, handleUpdatePost } from '../controllers/postController.js'
import { verifyUser } from '../middlewear/verifyUser.js';
// import { upload } from '../middlewear/multer.middlewear.js';

const router = express.Router()

router.get('/', handleGetAllPosts)

router.post('/create', verifyUser,  handleCreateNewPosts)

router.put('/update/:postId', verifyUser, handleUpdatePost)

router.delete('/delete/:postId', verifyUser, handleDeletePost)

// router.post('/create', verifyUser, upload.single('postImage'), handleCreateNewPosts)

// router.put('/update/:postId', verifyUser, upload.single('postImage'), handleUpdatePost)
export default router;