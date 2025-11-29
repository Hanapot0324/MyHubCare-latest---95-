import {
  Add as AddIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  Favorite as FavoriteIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Avatar,
  TextField,
  Typography,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  Badge
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

const Forum = ({ socket }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadPosts, setThreadPosts] = useState([]);
  const [showThreadDialog, setShowThreadDialog] = useState(false);
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [replyToPost, setReplyToPost] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPostForAction, setSelectedPostForAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingItems, setPendingItems] = useState({ posts: [], replies: [] });
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editReplyContent, setEditReplyContent] = useState('');
  
  // New thread form
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('general');
  const [newThreadTags, setNewThreadTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  // New post form
  const [postContent, setPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);

  const postInputRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
    loadThreads();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        
        // Check role in multiple possible fields
        const userRole = user.role || user.user_role || user.role_name || user.role_type;
        const isAdminUser = userRole === 'admin' || userRole === 'super_admin';
        
        console.log('[Forum] User loaded:', { 
          user, 
          role: userRole, 
          isAdmin: isAdminUser 
        });
        
        setIsAdmin(isAdminUser);
        if (isAdminUser) {
          loadPendingItems();
        }
      } else {
        console.warn('[Forum] No user found in localStorage');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPendingItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPendingItems({
          posts: data.pending_posts || [],
          replies: data.pending_replies || []
        });
      }
    } catch (error) {
      console.error('Error loading pending items:', error);
    }
  };

  const loadThreads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/threads`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setThreads(data.threads || []);
      } else {
        setToast({ message: data.message || 'Failed to load discussions', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      setToast({ message: 'Failed to load discussions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadThreadDetails = async (threadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/threads/${threadId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedThread(data.thread);
        setThreadPosts(data.posts || []);
        setShowThreadDialog(true);
      } else {
        setToast({ message: data.message || 'Failed to load discussion', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      setToast({ message: 'Failed to load discussion', type: 'error' });
    }
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newThreadTitle,
          content: newThreadContent,
          category: newThreadCategory,
          tags: newThreadTags
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Discussion created successfully!', type: 'success' });
        setShowNewThreadDialog(false);
        resetNewThreadForm();
        loadThreads();
      } else {
        setToast({ message: data.message || 'Failed to create discussion', type: 'error' });
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      setToast({ message: 'Failed to create discussion', type: 'error' });
    }
  };

  const handleAddPost = async () => {
    if (!postContent.trim()) {
      setToast({ message: 'Please enter a message', type: 'error' });
      return;
    }

    try {
      setPostLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/threads/${selectedThread.topic_id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: postContent,
          parentPostId: replyToPost?.post_id || null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPostContent('');
        setReplyToPost(null);
        loadThreadDetails(selectedThread.topic_id);
        setToast({ message: 'Message posted!', type: 'success' });
      } else {
        setToast({ message: data.message || 'Failed to post message', type: 'error' });
      }
    } catch (error) {
      console.error('Error posting:', error);
      setToast({ message: 'Failed to post message', type: 'error' });
    } finally {
      setPostLoading(false);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reactionType })
      });

      const data = await response.json();
      
      if (data.success) {
        loadThreadDetails(selectedThread.topic_id);
      } else {
        setToast({ message: data.message || 'Failed to update reaction', type: 'error' });
      }
    } catch (error) {
      console.error('Error reacting:', error);
      setToast({ message: 'Failed to update reaction', type: 'error' });
    }
  };

  // Admin moderation functions
  const handleApprovePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Post approved successfully', type: 'success' });
        loadPendingItems();
        loadThreads();
      } else {
        setToast({ message: data.message || 'Failed to approve post', type: 'error' });
      }
    } catch (error) {
      console.error('Error approving post:', error);
      setToast({ message: 'Failed to approve post', type: 'error' });
    }
  };

  const handleRejectPost = async (postId, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Post rejected successfully', type: 'success' });
        loadPendingItems();
        loadThreads();
      } else {
        setToast({ message: data.message || 'Failed to reject post', type: 'error' });
      }
    } catch (error) {
      console.error('Error rejecting post:', error);
      setToast({ message: 'Failed to reject post', type: 'error' });
    }
  };

  const handleApproveReply = async (replyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/replies/${replyId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Reply approved successfully', type: 'success' });
        loadPendingItems();
        if (selectedThread) {
          loadThreadDetails(selectedThread.topic_id);
        }
      } else {
        setToast({ message: data.message || 'Failed to approve reply', type: 'error' });
      }
    } catch (error) {
      console.error('Error approving reply:', error);
      setToast({ message: 'Failed to approve reply', type: 'error' });
    }
  };

  const handleRejectReply = async (replyId, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/replies/${replyId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Reply rejected successfully', type: 'success' });
        loadPendingItems();
        if (selectedThread) {
          loadThreadDetails(selectedThread.topic_id);
        }
      } else {
        setToast({ message: data.message || 'Failed to reject reply', type: 'error' });
      }
    } catch (error) {
      console.error('Error rejecting reply:', error);
      setToast({ message: 'Failed to reject reply', type: 'error' });
    }
  };

  // Post/Reply management functions
  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditPostContent(post.content || post.description || '');
  };

  const handleSavePostEdit = async () => {
    if (!editingPost || !editPostContent.trim()) {
      setToast({ message: 'Please enter content', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/posts/${editingPost.post_id || editingPost.topic_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editPostContent,
          title: editingPost.title
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Post updated successfully', type: 'success' });
        setEditingPost(null);
        setEditPostContent('');
        loadThreads();
        if (selectedThread) {
          loadThreadDetails(selectedThread.topic_id);
        }
      } else {
        setToast({ message: data.message || 'Failed to update post', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setToast({ message: 'Failed to update post', type: 'error' });
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Post deleted successfully', type: 'success' });
        loadThreads();
        if (selectedThread && selectedThread.topic_id === postId) {
          setShowThreadDialog(false);
          setSelectedThread(null);
        }
      } else {
        setToast({ message: data.message || 'Failed to delete post', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setToast({ message: 'Failed to delete post', type: 'error' });
    }
  };

  const handleEditReply = (reply) => {
    setEditingReply(reply);
    setEditReplyContent(reply.content || '');
  };

  const handleSaveReplyEdit = async () => {
    if (!editingReply || !editReplyContent.trim()) {
      setToast({ message: 'Please enter content', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/replies/${editingReply.reply_id || editingReply.post_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editReplyContent
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Reply updated successfully', type: 'success' });
        setEditingReply(null);
        setEditReplyContent('');
        if (selectedThread) {
          loadThreadDetails(selectedThread.topic_id);
        }
      } else {
        setToast({ message: data.message || 'Failed to update reply', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      setToast({ message: 'Failed to update reply', type: 'error' });
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: 'Reply deleted successfully', type: 'success' });
        if (selectedThread) {
          loadThreadDetails(selectedThread.topic_id);
        }
      } else {
        setToast({ message: data.message || 'Failed to delete reply', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      setToast({ message: 'Failed to delete reply', type: 'error' });
    }
  };

  const handlePinPost = async (postId, isPinned) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_pinned: !isPinned })
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: `Post ${!isPinned ? 'pinned' : 'unpinned'} successfully`, type: 'success' });
        loadThreads();
      } else {
        setToast({ message: data.message || 'Failed to update pin status', type: 'error' });
      }
    } catch (error) {
      console.error('Error pinning post:', error);
      setToast({ message: 'Failed to update pin status', type: 'error' });
    }
  };

  const handleLockPost = async (postId, isLocked) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/lock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_locked: !isLocked })
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: `Post ${!isLocked ? 'locked' : 'unlocked'} successfully`, type: 'success' });
        loadThreads();
        if (selectedThread) {
          loadThreadDetails(selectedThread.topic_id);
        }
      } else {
        setToast({ message: data.message || 'Failed to update lock status', type: 'error' });
      }
    } catch (error) {
      console.error('Error locking post:', error);
      setToast({ message: 'Failed to update lock status', type: 'error' });
    }
  };

  const resetNewThreadForm = () => {
    setNewThreadTitle('');
    setNewThreadContent('');
    setNewThreadCategory('general');
    setNewThreadTags([]);
    setTagInput('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newThreadTags.includes(tagInput.trim())) {
      setNewThreadTags([...newThreadTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewThreadTags(newThreadTags.filter(tag => tag !== tagToRemove));
  };

  const togglePostExpand = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const getFilteredThreads = () => {
    let filtered = threads;

    if (searchTerm) {
      filtered = filtered.filter(thread =>
        thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(thread => thread.category === filterCategory);
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.last_post_at || b.created_at) - new Date(a.last_post_at || a.created_at));
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
    } else if (sortBy === 'trending') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return filtered;
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: '#2196f3',
      health: '#4caf50',
      art: '#9c27b0',
      support: '#ff9800',
      announcement: '#f44336'
    };
    return colors[category] || '#757575';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderThreadCard = (thread) => (
    <Card
      key={thread.topic_id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        }
      }}
      onClick={() => loadThreadDetails(thread.topic_id)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar
            src={thread.profile_image}
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#D84040'
            }}
          >
            {thread.username?.[0]?.toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                {thread.full_name || thread.username}
              </Typography>
              <Typography variant="caption" sx={{ color: '#999' }}>
                • {formatTimeAgo(thread.created_at)}
              </Typography>
              <Chip
                label={thread.category}
                size="small"
                sx={{
                  ml: 'auto',
                  backgroundColor: getCategoryColor(thread.category),
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '10px'
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {thread.is_pinned && (
                <TrendingIcon sx={{ fontSize: 18, color: '#ff9800' }} title="Pinned" />
              )}
              {thread.is_locked && (
                <CloseIcon sx={{ fontSize: 18, color: '#f44336' }} title="Locked" />
              )}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  fontSize: '18px'
                }}
              >
                {thread.title}
              </Typography>
              {thread.status === 'pending' && (
                <Chip 
                  label="Pending" 
                  size="small" 
                  sx={{ bgcolor: '#ff9800', color: 'white', fontSize: '10px' }} 
                />
              )}
            </Box>
            
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {thread.description}
            </Typography>
            
            {thread.tags && thread.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                {thread.tags.map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={tag}
                    size="small"
                    sx={{
                      height: '22px',
                      fontSize: '11px',
                      backgroundColor: '#F8F2DE',
                      color: '#D84040'
                    }}
                  />
                ))}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CommentIcon sx={{ fontSize: 18, color: '#666' }} />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {thread.post_count || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ThumbUpIcon sx={{ fontSize: 18, color: '#666' }} />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {thread.total_reactions || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#999', ml: 'auto' }}>
                {thread.views || 0} views
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderPost = (post, isReply = false) => {
    const replies = threadPosts.filter(p => p.parent_post_id === post.post_id);
    const isExpanded = expandedPosts[post.post_id];

    return (
      <Box
        key={post.post_id}
        sx={{
          ml: isReply ? 6 : 0,
          mb: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            backgroundColor: isReply ? '#f9f9f9' : 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}
        >
          <Avatar
            src={post.profile_image}
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#D84040'
            }}
          >
            {post.username?.[0]?.toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                {post.full_name || post.username}
              </Typography>
              <Typography variant="caption" sx={{ color: '#999' }}>
                • {formatTimeAgo(post.created_at)}
              </Typography>
            </Box>
            
            <Typography
              variant="body2"
              sx={{
                color: '#333',
                mb: 2,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}
            >
              {post.content}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <IconButton
                size="small"
                onClick={() => handleReaction(post.post_id, 'like')}
                sx={{
                  color: post.user_reactions?.includes('like') ? '#D84040' : '#666'
                }}
              >
                <ThumbUpIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {post.reactions?.like || 0}
              </Typography>
              
              <IconButton
                size="small"
                onClick={() => handleReaction(post.post_id, 'love')}
                sx={{
                  color: post.user_reactions?.includes('love') ? '#e91e63' : '#666'
                }}
              >
                <FavoriteIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {post.reactions?.love || 0}
              </Typography>
              
              {!post.is_locked && (
                <Button
                  size="small"
                  startIcon={<ReplyIcon />}
                  onClick={() => {
                    setReplyToPost(post);
                    postInputRef.current?.focus();
                  }}
                  sx={{ ml: 1, textTransform: 'none' }}
                >
                  Reply
                </Button>
              )}
              
              {(isAdmin || (currentUser && post.author_id === currentUser.user_id)) && (
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditPost(post)}
                    sx={{ color: '#666' }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeletePost(post.post_id || post.topic_id)}
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  {isAdmin && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handlePinPost(post.post_id || post.topic_id, post.is_pinned)}
                        sx={{ color: post.is_pinned ? '#ff9800' : '#666' }}
                        title={post.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        <TrendingIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleLockPost(post.post_id || post.topic_id, post.is_locked)}
                        sx={{ color: post.is_locked ? '#f44336' : '#666' }}
                        title={post.is_locked ? 'Unlock' : 'Lock'}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </>
                  )}
                </Box>
              )}
              
              {replies.length > 0 && (
                <Button
                  size="small"
                  onClick={() => togglePostExpand(post.post_id)}
                  sx={{ textTransform: 'none' }}
                >
                  {isExpanded ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
        
        {isExpanded && replies.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {replies.map(reply => {
              const replyWithActions = (
                <Box key={reply.post_id || reply.reply_id} sx={{ position: 'relative' }}>
                  {renderPost(reply, true)}
                  {(isAdmin || (currentUser && reply.author_id === currentUser.user_id)) && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditReply(reply)}
                        sx={{ color: '#666', bgcolor: 'white', boxShadow: 1 }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteReply(reply.reply_id || reply.post_id)}
                        sx={{ color: '#f44336', bgcolor: 'white', boxShadow: 1 }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              );
              return replyWithActions;
            })}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pt: 12, pb: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #D84040 0%, #A31D1D 100%)',
            p: 4,
            borderRadius: '12px',
            mb: 3,
            boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
              Community Forum
            </Typography>
            <Typography variant="body1" sx={{ color: '#F8F2DE' }}>
              Connect, share experiences, and support each other
            </Typography>
          </Box>
          {(isAdmin || (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin'))) && (
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={() => setShowModerationPanel(true)}
              sx={{
                bgcolor: 'white',
                color: '#D84040',
                textTransform: 'none',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              Moderation
              {(pendingItems.posts.length > 0 || pendingItems.replies.length > 0) && (
                <Badge badgeContent={pendingItems.posts.length + pendingItems.replies.length} color="error" sx={{ ml: 1 }}>
                </Badge>
              )}
            </Button>
          )}
        </Box>

        {/* Search and Filters */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: '250px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <Tabs
              value={filterCategory}
              onChange={(e, val) => setFilterCategory(val)}
              sx={{ minHeight: '40px' }}
            >
              <Tab label="All" value="all" sx={{ minHeight: '40px', textTransform: 'none' }} />
              <Tab label="General" value="general" sx={{ minHeight: '40px', textTransform: 'none' }} />
              <Tab label="Health" value="health" sx={{ minHeight: '40px', textTransform: 'none' }} />
              <Tab label="Support" value="support" sx={{ minHeight: '40px', textTransform: 'none' }} />
            </Tabs>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewThreadDialog(true)}
              sx={{
                bgcolor: '#D84040',
                textTransform: 'none',
                '&:hover': { bgcolor: '#A31D1D' }
              }}
            >
              New Discussion
            </Button>
          </Box>
        </Card>

        {/* Threads List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : getFilteredThreads().length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#666', mb: 2 }}>
              No discussions found. Start a new one!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewThreadDialog(true)}
              sx={{
                bgcolor: '#D84040',
                textTransform: 'none',
                '&:hover': { bgcolor: '#A31D1D' }
              }}
            >
              Create Discussion
            </Button>
          </Card>
        ) : (
          <Box>
            {getFilteredThreads().map(thread => renderThreadCard(thread))}
          </Box>
        )}

        {/* New Thread Dialog */}
        <Dialog
          open={showNewThreadDialog}
          onClose={() => setShowNewThreadDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', fontWeight: 600 }}>
            Start a New Discussion
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              fullWidth
              label="Title"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              label="Category"
              select
              value={newThreadCategory}
              onChange={(e) => setNewThreadCategory(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="health">Health</MenuItem>
              <MenuItem value="art">Art & Creativity</MenuItem>
              <MenuItem value="support">Support</MenuItem>
              <MenuItem value="announcement">Announcement</MenuItem>
            </TextField>
            
            <TextField
              fullWidth
              label="Content"
              multiline
              rows={6}
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                size="small"
              />
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                {newThreadTags.map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    sx={{ bgcolor: '#F8F2DE', color: '#D84040' }}
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setShowNewThreadDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateThread}
              sx={{
                bgcolor: '#D84040',
                '&:hover': { bgcolor: '#A31D1D' }
              }}
            >
              Create Discussion
            </Button>
          </DialogActions>
        </Dialog>

        {/* Thread Dialog */}
        <Dialog
          open={showThreadDialog}
          onClose={() => setShowThreadDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { maxHeight: '90vh' }
          }}
        >
          {selectedThread && (
            <>
              <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    src={selectedThread.profile_image}
                    sx={{ width: 48, height: 48, bgcolor: '#D84040' }}
                  >
                    {selectedThread.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {selectedThread.is_pinned && (
                        <TrendingIcon sx={{ fontSize: 18, color: '#ff9800' }} title="Pinned" />
                      )}
                      {selectedThread.is_locked && (
                        <CloseIcon sx={{ fontSize: 18, color: '#f44336' }} title="Locked" />
                      )}
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedThread.title}
                      </Typography>
                      {selectedThread.status === 'pending' && (
                        <Chip 
                          label="Pending" 
                          size="small" 
                          sx={{ bgcolor: '#ff9800', color: 'white', fontSize: '10px' }} 
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        by {selectedThread.full_name || selectedThread.username}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        • {formatTimeAgo(selectedThread.created_at)}
                      </Typography>
                      <Chip
                        label={selectedThread.category}
                        size="small"
                        sx={{
                          backgroundColor: getCategoryColor(selectedThread.category),
                          color: 'white',
                          height: '20px',
                          fontSize: '10px'
                        }}
                      />
                    </Box>
                  </Box>
                  <IconButton onClick={() => setShowThreadDialog(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              
              <DialogContent sx={{ p: 3 }}>
                <Typography sx={{ mb: 3, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedThread.description}
                </Typography>
                
                {selectedThread.tags && selectedThread.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 3, flexWrap: 'wrap' }}>
                    {selectedThread.tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        sx={{ bgcolor: '#F8F2DE', color: '#D84040' }}
                      />
                    ))}
                  </Box>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Responses ({threadPosts.filter(p => !p.parent_post_id).length})
                </Typography>
                
                {threadPosts.filter(p => !p.parent_post_id).map(post => renderPost(post))}
              </DialogContent>
              
              <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', flexDirection: 'column', alignItems: 'stretch' }}>
                {replyToPost && (
                  <Alert
                    severity="info"
                    onClose={() => setReplyToPost(null)}
                    sx={{ mb: 1 }}
                  >
                    Replying to {replyToPost.full_name || replyToPost.username}
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Write a response..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    inputRef={postInputRef}
                    disabled={postLoading}
                  />
                  <Button
                    variant="contained"
                    endIcon={postLoading ? <CircularProgress size={20} /> : <SendIcon />}
                    onClick={handleAddPost}
                    disabled={postLoading || !postContent.trim()}
                    sx={{
                      bgcolor: '#D84040',
                      minWidth: '100px',
                      '&:hover': { bgcolor: '#A31D1D' }
                    }}
                  >
                    Post
                  </Button>
                </Box>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Moderation Panel Dialog */}
        {(isAdmin || (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin'))) && (
        <Dialog
          open={showModerationPanel}
          onClose={() => setShowModerationPanel(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
            Moderation Panel
            {(pendingItems.posts.length > 0 || pendingItems.replies.length > 0) && (
              <Badge badgeContent={pendingItems.posts.length + pendingItems.replies.length} color="error" />
            )}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Tabs value={pendingItems.posts.length > 0 ? 0 : 1} sx={{ mb: 2 }}>
              <Tab 
                label={`Pending Posts (${pendingItems.posts.length})`} 
                value={0}
              />
              <Tab 
                label={`Pending Replies (${pendingItems.replies.length})`} 
                value={1}
              />
            </Tabs>

            {/* Pending Posts */}
            {pendingItems.posts.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Pending Posts</Typography>
                {pendingItems.posts.map((post) => (
                  <Card key={post.post_id} sx={{ mb: 2, p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      {post.content.substring(0, 200)}...
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      by {post.author_name} • {formatTimeAgo(post.created_at)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleApprovePost(post.post_id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleRejectPost(post.post_id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}

            {/* Pending Replies */}
            {pendingItems.replies.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Pending Replies</Typography>
                {pendingItems.replies.map((reply) => (
                  <Card key={reply.reply_id} sx={{ mb: 2, p: 2 }}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      {reply.content.substring(0, 200)}...
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>
                      Reply to: {reply.post_title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      by {reply.author_name} • {formatTimeAgo(reply.created_at)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleApproveReply(reply.reply_id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleRejectReply(reply.reply_id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}

            {pendingItems.posts.length === 0 && pendingItems.replies.length === 0 && (
              <Typography sx={{ textAlign: 'center', color: '#666', py: 4 }}>
                No pending items to moderate
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModerationPanel(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        )}

        {/* Edit Post Dialog */}
        <Dialog
          open={!!editingPost}
          onClose={() => {
            setEditingPost(null);
            setEditPostContent('');
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Post</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={editingPost?.title || ''}
              disabled
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Content"
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setEditingPost(null);
              setEditPostContent('');
            }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSavePostEdit}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Reply Dialog */}
        <Dialog
          open={!!editingReply}
          onClose={() => {
            setEditingReply(null);
            setEditReplyContent('');
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Reply</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Content"
              value={editReplyContent}
              onChange={(e) => setEditReplyContent(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setEditingReply(null);
              setEditReplyContent('');
            }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSaveReplyEdit}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast */}
        {toast && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              bgcolor: toast.type === 'success' ? '#4caf50' : '#f44336',
              color: 'white',
              px: 3,
              py: 2,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 9999
            }}
          >
            {toast.message}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Forum;
