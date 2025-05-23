import Notification from "../models/notoification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from 'cloudinary';


export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "comments.user",
            select: "-password"
        })

        if(posts.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPosts controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const id = req.user._id.toString();

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!text && !img) {
            return res.status(400).json({ message: "Please provide text or image" });
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img, { folder: "posts" });
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({
            user: id,
            text,
            img
        })

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.log("Error in createPost controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const likeUnlikePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const isLiked = post.likes.includes(userId);
        if (isLiked) {
            // unlike the post
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());

            res.status(200).json(updatedLikes);
        }
        else {
            // like the post
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
            await post.save()

            // Notify the user who created the post

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like",
            })
            await notification.save();
            const updatedLikes = post.likes;
            res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if (!text) {
            return res.status(400).json({ message: "Please provide a comment" });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = { user: userId, text };
        post.comments.push(comment);
        await post.save();

        const notification = new Notification({
            from: userId,
            to: post.user,
            type: "comment",
        })
        await notification.save();
        res.status(201).json(post);
    } catch (error) {
        console.log("Error in commentOnPost controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// export const deleteComment = async (req, res) => {
//     try {
//         const commentId = req.params.id;
//         const postId = req.params.postId;

//         const post = await Post.findById(postId);

//         if (!post) {
//             return res.status(404).json({ message: "Post not found" });
//         }

//         const comment = post.comments.find((comment) => comment._id.toString() === commentId);

//         if (!comment) {
//             return res.status(404).json({ message: "Comment not found" });
//         }

//         if (comment.user.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: "You are not authorized to delete this comment" });
//         }

//         await Post.updateOne(
//             { "_id": postId },
//             { $pull: { comments: { _id: commentId } } }
//         )
//         res.status(200).json({ message: "Comment deleted successfully" });
//     } catch (error) {
//         console.log("Error in deleteComment controller: ", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this post" });
        }

        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`posts/${imgId}`);
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
        .populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        })
        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ message: "User not found" });

        const followingUsers = user.following;
        const feedPosts = await Post.find({ user: { $in: followingUsers } })
        .sort({ createdAt: -1 })
        .populate({
            path: "comments.user",
            select: "-password"
        })

        res.status(200).json(feedPosts);
    } catch (error) {
        console.log("Error in getFollowingPosts controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not found" });

        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getUserPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};