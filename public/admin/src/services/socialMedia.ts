import api from "./api";

export interface SocialMediaPost {
    id: string;
    platform: string;
    author: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares: number;
    mediaUrl?: string;
    url: string;
    isLiked: boolean;
    isSaved: boolean;
    metadata?: Record<string, any>;
}

export interface SocialMediaActivityParams {
    platform?: string;
    sort?: 'recent' | 'likes' | 'comments';
    search?: string;
    limit?: number;
    offset?: number;
}

export const getSocialMediaActivity = async (
    deviceId: string,
    params?: SocialMediaActivityParams
): Promise<SocialMediaPost[]> => {
    const response = await api.get(`/devices/${deviceId}/social-media/activity`, { params });
    return response.data;
};

export const likePost = async (deviceId: string, postId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/social-media/posts/${postId}/like`);
};

export const unlikePost = async (deviceId: string, postId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/social-media/posts/${postId}/like`);
};

export const savePost = async (deviceId: string, postId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/social-media/posts/${postId}/save`);
};

export const unsavePost = async (deviceId: string, postId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/social-media/posts/${postId}/save`);
};

export const sharePost = async (
    deviceId: string,
    postId: string,
    targetPlatforms: string[]
): Promise<void> => {
    await api.post(`/devices/${deviceId}/social-media/posts/${postId}/share`, { targetPlatforms });
};

export const getPostDetails = async (
    deviceId: string,
    postId: string
): Promise<SocialMediaPost> => {
    const response = await api.get(`/devices/${deviceId}/social-media/posts/${postId}`);
    return response.data;
};

export const getPostComments = async (
    deviceId: string,
    postId: string,
    params?: { limit?: number; offset?: number }
) => {
    const response = await api.get(`/devices/${deviceId}/social-media/posts/${postId}/comments`, { params });
    return response.data;
};

export const postComment = async (
    deviceId: string,
    postId: string,
    content: string
) => {
    const response = await api.post(`/devices/${deviceId}/social-media/posts/${postId}/comments`, { content });
    return response.data;
};

export const getSocialMediaStats = async (deviceId: string) => {
    const response = await api.get(`/devices/${deviceId}/social-media/stats`);
    return response.data;
};

export const getConnectedAccounts = async (deviceId: string) => {
    const response = await api.get(`/devices/${deviceId}/social-media/accounts`);
    return response.data;
};

export const connectAccount = async (
    deviceId: string,
    platform: string,
    credentials: any
) => {
    const response = await api.post(`/devices/${deviceId}/social-media/accounts/connect`, {
        platform,
        credentials
    });
    return response.data;
};

export const disconnectAccount = async (deviceId: string, accountId: string) => {
    await api.delete(`/devices/${deviceId}/social-media/accounts/${accountId}`);
};