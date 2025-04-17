import bcrypt from "bcryptjs";
import {v2 as cloudinary} from "cloudinary";

//models
import Notification from "../models/notoification.model.js";
import User from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
    const { username } = req.params;
    try {
        // Find user by username
        const user = await User.findOne({ username })
            .select("-password")

        if (!user) return res.status(404).json({ error: "User not found" });

        // Return user profile data
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const followUnfollowUser = async (req, res) => {
    try {
        const {id} = req.params
        const userToFollow = await User.findById(id);
        const loggedInUser = await User.findById(req.user._id);

        if(id === req.user._id.toString()) return res.status(400).json({ error: "Cannot follow/unfollow yourself" });

        if(!userToFollow || !loggedInUser) return res.status(404).json({ error: "User not found" });

        const isFollowing = loggedInUser.following.includes(id);

        if(isFollowing){
            // unfollow the user
            await User.findByIdAndUpdate(id, {$pull: { followers: req.user._id }})
            await User.findByIdAndUpdate(req.user._id, {$pull : { following: id }})
            res.status(200).json({ message: "User Unfollowed successfully" });
        } else {
            // follow the user
            await User.findByIdAndUpdate(id, {$push: { followers: req.user._id }})
            await User.findByIdAndUpdate(req.user._id, {$push : { following: id }})
            // send notification to userToFollow

            const newNotification =  new Notification({
                type: "follow",
                from: req.user._id,
                to: userToFollow._id,
            })

            await newNotification.save();

            res.status(200).json({ message: "User Followed successfully" });
        }

    } catch (error) {
        console.log("Error in followUnfollowUser controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getSuggestedUsers = async (req, res) => {
    try {
        const id = req.user._id;

        const followedByMe = await User.findById(id).select("following");
        const users = await User.aggregate([{
            $match: {
                _id: { $ne: id }
            },
        }, {
            $sample: { size: 10 }
        }
        ])

        const filteredUsers = users.filter(user => !followedByMe.following.includes(user._id))

        const suggestedUsers = filteredUsers.slice(0, 4);
        suggestedUsers.forEach(user => user.password = null);
        res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in getSuggestedUsers controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const updateUser = async (req, res) => {
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body
    const {profileImg, coverImg } = req.body

    const id = req.user._id;
     
    try {
        let user = await User.findById(id);

        if(!user) return res.status(404).json({ error: "User not found" });

        if((!newPassword && currentPassword) || (!currentPassword && newPassword)) return res.status(400).json({ error: "Please provide both current and new password" });

        if(currentPassword && newPassword){
            const isMatch = await bcrypt.compare(currentPassword, user.password)
            if(!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

            if(newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters long" });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if(profileImg){

            if(user.profileImg){
                // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

           const uploadedResponse =  await cloudinary.uploader.upload(profileImg)
           profileImg = uploadedResponse.secure_url;
        }

        if(coverImg){
            if(user.coverImg){
                // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse =  await cloudinary.uploader.upload(coverImg)
            coverImg = uploadedResponse.secure_url;
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        user.password = null;

        return res.status(200).json(user);
    } catch (error) {
        console.log("Error in updateUser controller", error.message);
        res.status(500).json({ error: error.message });
    }
}