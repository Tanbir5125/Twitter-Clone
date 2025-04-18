import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { createComment, createPost, deleteComment, deletePost, getAllPosts, getFollowingPosts, getLikedPosts, getUserPosts, likeUnlikePost } from '../controllers/post.controller.js';

const router = express.Router();

router.get("/all",protectRoute, getAllPosts);
router.get("/following",protectRoute,getFollowingPosts);
router.get('/liked/:id',protectRoute, getLikedPosts);
router.get('/user/:username',protectRoute, getUserPosts);
router.post('/create',protectRoute, createPost);
router.post('/like/:id',protectRoute, likeUnlikePost);
router.post('/comment/:id',protectRoute, createComment);
router.delete("/comment/:postId/:id",protectRoute, deleteComment);
router.delete("/:id",protectRoute, deletePost);

export default router; 