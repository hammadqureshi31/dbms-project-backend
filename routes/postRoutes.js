import express from 'express'
import { handleCreateNewPosts, handleDeletePost, handleGetAllPosts, handleUpdatePost, handleGetPostById } from '../controllers/postController.js'
import { verifyUser } from '../middlewear/verifyUser.js';
// import { upload } from '../middlewear/multer.middlewear.js';

const router = express.Router()

router.get('/pages', handleGetAllPosts)

router.post('/create', verifyUser,  handleCreateNewPosts)

router .get('/:id', handleGetPostById)

router.put('/update/:postId', verifyUser, handleUpdatePost)

router.delete('/delete/:postId', verifyUser, handleDeletePost)

// router.post('/create', verifyUser, upload.single('postImage'), handleCreateNewPosts)

// router.put('/update/:postId', verifyUser, upload.single('postImage'), handleUpdatePost)
export default router;