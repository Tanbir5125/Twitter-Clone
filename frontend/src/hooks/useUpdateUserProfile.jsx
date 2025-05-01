import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useMutation({
        mutationFn: async (formData) => {
            try {
                const res = await fetch(`/api/users/update`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                // Check for duplicate key errors
                if (error.message && error.message.includes("duplicate key")) {
                    // Check which field caused the duplicate key error
                    if (error.message.includes("email")) {
                        throw new Error("Email already in use.");
                    } else if (error.message.includes("username")) {
                        throw new Error("Username already taken.");
                    } else {
                        // Generic duplicate key error for other fields
                        throw new Error("This information is already in use by another account.");
                    }
                }

                // Make sure we're handling the error properly
                if (error instanceof Error) {
                    throw error;
                } else {
                    throw new Error("Something went wrong");
                }
            }
        },
        onSuccess: () => {
            toast.success("Profile updated successfully");
            // Use Promise.all to wait for both queries to be invalidated
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
            ]);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return { updateProfile, isUpdatingProfile };
};

export default useUpdateUserProfile;