import {
  Add as AddIcon,
  Book as BookIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Link as LinkIcon,
  MoreVert as MoreVertIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  DirectionsRun as RunIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Shield as ShieldIcon,
  Info as InfoIcon,
  CloudDownload as DownloadIcon,
  AutoAwesome as MagicIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  Favorite as FavoriteIcon,
  Reply as ReplyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  FormControlLabel as MuiFormControlLabel,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Checkbox,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  Avatar,
  Badge,
  Tooltip,
  Collapse
} from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

const Education = ({ socket }) => {
  const [activeTab, setActiveTab] = useState('modules');
  const [modules, setModules] = useState([]);
  const [completedModules, setCompletedModules] = useState([]);
  const [completedSteps, setCompletedSteps] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [forumThreads, setForumThreads] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [forumLoading, setForumLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal states
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [showThreadDialog, setShowThreadDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedModuleForAction, setSelectedModuleForAction] = useState(null);
  
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [moduleStep, setModuleStep] = useState(0);
  const [replyToPost, setReplyToPost] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});

  // Forum specific states
  const [forumFilterCategory, setForumFilterCategory] = useState('all');
  const [forumSortBy, setForumSortBy] = useState('recent');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('general');
  const [newThreadTags, setNewThreadTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const postInputRef = useRef(null);

  // New post form
  const [postTitle, setPostTitle] = useState('');
  const [postContentLegacy, setPostContentLegacy] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(true);

  // Module form
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleCategory, setModuleCategory] = useState('BASICS');
  const [moduleLink, setModuleLink] = useState('');
  const [moduleReadTime, setModuleReadTime] = useState('');
  const [moduleContent, setModuleContent] = useState('');
  const [moduleFormLoading, setModuleFormLoading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  // Default forum posts
  const defaultForumPosts = [
    {
      id: 1,
      author: 'Anonymous User',
      title: 'Tips for Managing Side Effects',
      content: 'I wanted to share some tips that have helped me manage medication side effects...',
      replies: 5,
      date: '2 days ago',
    },
    {
      id: 2,
      author: 'Community Member',
      title: 'Staying Positive and Healthy',
      content: 'Here are some daily habits that have improved my quality of life...',
      replies: 12,
      date: '5 days ago',
    },
    {
      id: 3,
      author: 'Support Group',
      title: 'Monthly Virtual Support Meeting',
      content: 'Join us for our monthly virtual support group meeting this Saturday...',
      replies: 8,
      date: '1 week ago',
    },
  ];

  // Function to format content for proper display
  const formatContent = (content) => {
    if (!content) return '<p>No content available for this module.</p>';
    
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Check if there are any paragraph tags
    const paragraphs = tempDiv.querySelectorAll('p');
    
    // If no paragraphs, create them from text blocks
    if (paragraphs.length === 0) {
      const text = tempDiv.textContent || tempDiv.innerText || '';
      if (text) {
        // Split by double line breaks or periods followed by space and capital letter
        const textBlocks = text.split(/\n\n|(?<=\.)\s+(?=[A-Z])/);
        let formattedContent = '';
        
        textBlocks.forEach(block => {
          if (block.trim().length > 0) {
            formattedContent += `<p>${block.trim()}</p>`;
          }
        });
        
        return formattedContent;
      }
    }
    
    // Ensure proper styling for existing elements
    const allParagraphs = tempDiv.querySelectorAll('p');
    allParagraphs.forEach(p => {
      p.style.marginBottom = '16px';
      p.style.lineHeight = '1.8';
      p.style.textAlign = 'justify';
      p.style.textIndent = '1.5em';
    });
    
    return tempDiv.innerHTML;
  };

  useEffect(() => {
    checkAdminStatus();
    loadCurrentUser();
    
    const savedCompletedModules = JSON.parse(localStorage.getItem('completedModules')) || [];
    setCompletedModules(savedCompletedModules);
    
    const savedCompletedSteps = JSON.parse(localStorage.getItem('completedSteps')) || {};
    setCompletedSteps(savedCompletedSteps);
    
    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    localStorage.setItem('completedSteps', JSON.stringify(completedSteps));
  }, [completedSteps]);

  const loadCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const checkAdminStatus = () => {
    try {
      // Check for user object in localStorage
      const userStr = localStorage.getItem('user') || localStorage.getItem('userData');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && (user.role === 'admin' || user.role === 'super_admin')) {
          setIsAdmin(true);
          console.log('Admin status confirmed from user object');
          return;
        }
      }
      
      // Check for separate role field
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'admin' || userRole === 'super_admin') {
        setIsAdmin(true);
        console.log('Admin status confirmed from userRole');
        return;
      }
      
      // Check for token (might indicate logged in user)
      const token = localStorage.getItem('token');
      if (token) {
        // Try to decode token to check role (if it's a JWT)
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          if (tokenPayload.role === 'admin' || tokenPayload.role === 'super_admin') {
            setIsAdmin(true);
            console.log('Admin status confirmed from token');
            return;
          }
        } catch (e) {
          // Token might not be JWT or is malformed
          console.log('Could not decode token for role check');
        }
      }
      
      console.log('Admin status: Not an admin');
      setIsAdmin(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const loadData = async () => {
    await fetchModules();
    
    const storedPosts = JSON.parse(localStorage.getItem('forumPosts')) || defaultForumPosts;
    setForumPosts(storedPosts);
    
    await fetchFAQs();
    await loadForumThreads();
    
    setLoading(false);
  };

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/learning-modules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setModules(data.modules || []);
        }
      } else {
        console.error('Failed to fetch modules');
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchFAQs = async () => {
    try {
      setFaqsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/faqs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const publishedFaqs = (data.faqs || []).filter(faq => faq.is_published);
          setFaqs(publishedFaqs);
        }
      } else {
        console.error('Failed to fetch FAQs');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setFaqsLoading(false);
    }
  };

  const loadForumThreads = async () => {
    try {
      setForumLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/forum/threads`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setForumThreads(data.threads || []);
      } else {
        console.error('Failed to load forum threads');
      }
    } catch (error) {
      console.error('Error loading forum threads:', error);
    } finally {
      setForumLoading(false);
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
        setForumPosts(data.posts || []);
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
        loadForumThreads();
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

  const handleAddModule = async () => {
    if (!moduleLink) {
      setToast({ message: 'Please provide a valid URL', type: 'error' });
      return;
    }

    try {
      setModuleFormLoading(true);
      setExtractionProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/learning-modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          link_url: moduleLink,
          category: moduleCategory
        }),
      });

      clearInterval(progressInterval);
      setExtractionProgress(100);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setToast({ message: 'Module extracted and added successfully!', type: 'success' });
          setShowAddModuleModal(false);
          resetModuleForm();
          await fetchModules();
        } else {
          setToast({ message: data.message || 'Failed to add module', type: 'error' });
        }
      } else {
        setToast({ message: 'Failed to add module', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding module:', error);
      setToast({ message: 'An error occurred while adding module', type: 'error' });
    } finally {
      setModuleFormLoading(false);
      setTimeout(() => setExtractionProgress(0), 1000);
    }
  };

  const handleUpdateModule = async () => {
    if (!moduleLink) {
      setToast({ message: 'Please provide a valid URL', type: 'error' });
      return;
    }

    try {
      setModuleFormLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/learning-modules/${selectedModuleForAction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: moduleTitle,
          description: moduleDescription,
          category: moduleCategory,
          link_url: moduleLink,
          read_time: moduleReadTime,
          content: moduleContent
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setToast({ message: 'Module updated successfully', type: 'success' });
          setShowEditModuleModal(false);
          resetModuleForm();
          await fetchModules();
        } else {
          setToast({ message: data.message || 'Failed to update module', type: 'error' });
        }
      } else {
        setToast({ message: 'Failed to update module', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating module:', error);
      setToast({ message: 'An error occurred while updating module', type: 'error' });
    } finally {
      setModuleFormLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/learning-modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setToast({ message: 'Module deleted successfully', type: 'success' });
          await fetchModules();
        } else {
          setToast({ message: data.message || 'Failed to delete module', type: 'error' });
        }
      } else {
        setToast({ message: 'Failed to delete module', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      setToast({ message: 'An error occurred while deleting module', type: 'error' });
    }
  };

  const resetModuleForm = () => {
    setModuleTitle('');
    setModuleDescription('');
    setModuleCategory('BASICS');
    setModuleLink('');
    setModuleReadTime('');
    setModuleContent('');
    setSelectedModuleForAction(null);
    setModuleStep(0);
    setExtractionProgress(0);
  };

  const openEditModuleModal = (module) => {
    setSelectedModuleForAction(module);
    setModuleTitle(module.title);
    setModuleDescription(module.description || '');
    setModuleCategory(module.category || 'BASICS');
    setModuleLink(module.link_url);
    setModuleReadTime(module.read_time || '');
    setModuleContent(module.content || '');
    setShowEditModuleModal(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (event, module) => {
    setAnchorEl(event.currentTarget);
    setSelectedModuleForAction(module);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModuleForAction(null);
  };

  const handleMarkAsComplete = () => {
    if (!selectedModule) return;
    
    const updatedCompletedModules = [...completedModules, {
      moduleId: selectedModule.id,
      completedAt: new Date().toISOString()
    }];
    
    setCompletedModules(updatedCompletedModules);
    localStorage.setItem('completedModules', JSON.stringify(updatedCompletedModules));
    
    setCompletedSteps(prev => ({
      ...prev,
      [selectedModule.id]: [0, 1, 2]
    }));
    
    setShowModuleModal(false);
    setToast({ message: 'Module marked as complete!', type: 'success' });
  };

  const handleNextStep = () => {
    // Mark current step as completed
    setCompletedSteps(prev => ({
      ...prev,
      [selectedModule.id]: [...(prev[selectedModule.id] || []), moduleStep]
    }));
    
    // Move to next step
    setModuleStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setModuleStep(prev => prev - 1);
  };

  const getModuleIcon = (category) => {
    const iconSize = 50;
  
    if (category === 'BASICS') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center', width: iconSize, height: iconSize }}>
          <Box
            sx={{
              width: iconSize * 0.8,
              height: iconSize * 0.6,
              backgroundColor: '#4caf50',
              transform: 'rotate(-5deg)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
          <Box
            sx={{
              width: iconSize * 0.8,
              height: iconSize * 0.6,
              backgroundColor: '#f44336',
              transform: 'rotate(2deg)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
          <Box
            sx={{
              width: iconSize * 0.8,
              height: iconSize * 0.6,
              backgroundColor: '#03a9f4',
              transform: 'rotate(-3deg)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
        </Box>
      );
    }
    if (category === 'TREATMENT') {
      return (
        <Box
          sx={{
            width: iconSize,
            height: iconSize * 0.6,
            borderRadius: '15px',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: '50%',
              height: '100%',
              backgroundColor: '#f44336',
            }}
          />
          <Box
            sx={{
              width: '50%',
              height: '100%',
              backgroundColor: '#ff9800',
            }}
          />
        </Box>
      );
    }
    if (category === 'LIFESTYLE') {
      return <RunIcon sx={{ fontSize: iconSize, color: '#ff9800' }} />;
    }
    if (category === 'PREVENTION') {
      return <ShieldIcon sx={{ fontSize: iconSize, color: '#03a9f4' }} />;
    }
    return <BookIcon sx={{ fontSize: iconSize, color: 'white' }} />;
  };

  const getModuleIconColor = (category) => {
    return '#D84040';
  };

  const getFilteredModules = () => {
    let filtered = modules;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (module) =>
          module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (module.description && module.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (module.category && module.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const getFilteredThreads = () => {
    let filtered = forumThreads;

    if (searchTerm) {
      filtered = filtered.filter(thread =>
        thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (forumFilterCategory !== 'all') {
      filtered = filtered.filter(thread => thread.category === forumFilterCategory);
    }

    // Sort
    if (forumSortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.last_post_at || b.created_at) - new Date(a.last_post_at || a.created_at));
    } else if (forumSortBy === 'popular') {
      filtered.sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
    } else if (forumSortBy === 'trending') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return filtered;
  };

  const isModuleCompleted = (moduleId) => {
    return completedModules.some(cm => cm.moduleId === moduleId);
  };

  const isStepCompleted = (moduleId, step) => {
    return completedSteps[moduleId] && completedSteps[moduleId].includes(step);
  };

  const handleViewModule = (module) => {
    setSelectedModule(module);
    setShowModuleModal(true);
    setModuleStep(0);
    
    if (!completedSteps[module.id]) {
      setCompletedSteps(prev => ({
        ...prev,
        [module.id]: []
      }));
    }
  };

  const handleSubmitPost = () => {
    if (!postTitle || !postContentLegacy) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    const newPost = {
      id: Date.now(),
      author: postAnonymously ? 'Anonymous User' : 'Community Member',
      title: postTitle,
      content: postContentLegacy,
      replies: 0,
      date: 'Just now',
    };

    const updatedPosts = [newPost, ...forumPosts];
    setForumPosts(updatedPosts);
    localStorage.setItem('forumPosts', JSON.stringify(updatedPosts));

    setPostTitle('');
    setPostContentLegacy('');
    setPostAnonymously(true);
    setShowNewPostModal(false);

    setToast({ message: 'Your post has been submitted and is pending moderation', type: 'success' });
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
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

  // Render Learning Modules Tab
  const renderModulesTab = () => {
    const filteredModules = getFilteredModules();

    return (
      <Paper
        sx={{
          p: 3,
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: '10px',
          border: '1px solid #ffff',
          marginTop: '10px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#333',
              fontSize: '20px',
            }}
          >
            Interactive Learning Modules
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: '#666' }} />,
              }}
              sx={{
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  backgroundColor: 'white',
                },
              }}
            />
            {/* Only show Add Module button for admins */}
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetModuleForm();
                  setShowAddModuleModal(true);
                }}
                sx={{
                  backgroundColor: '#D84040',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: '4px',
                  padding: '8px 16px',
                  '&:hover': {
                    backgroundColor: '#A31D1D',
                  },
                }}
              >
                Add Module
              </Button>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredModules.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography sx={{ color: '#666' }}>
              {searchTerm ? 'No modules found matching your search' : 'No modules available at the moment.'}
            </Typography>
            {/* Only show Add Module button for admins */}
            {isAdmin && !searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetModuleForm();
                  setShowAddModuleModal(true);
                }}
                sx={{
                  mt: 2,
                  backgroundColor: '#D84040',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: '4px',
                  padding: '8px 16px',
                  '&:hover': {
                    backgroundColor: '#A31D1D',
                  },
                }}
              >
                Add Your First Module
              </Button>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              justifyContent: 'flex-start',
              mt: 2,
            }}
          >
            {filteredModules.map((module) => (
              <Card
                key={module.id}
                sx={{
                  width: '300px',
                  height: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                  },
                  position: 'relative',
                }}
              >
                {/* Only show menu button for admins */}
                {isAdmin && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, module)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      zIndex: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      }
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => selectedModuleForAction && openEditModuleModal(selectedModuleForAction)}>
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    if (selectedModuleForAction) {
                      handleDeleteModule(selectedModuleForAction.id);
                      handleMenuClose();
                    }
                  }}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                  </MenuItem>
                </Menu>
                <Box
                  sx={{
                    backgroundColor: getModuleIconColor(module.category),
                    p: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '140px',
                  }}
                >
                  {getModuleIcon(module.category)}
                </Box>
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    p: 2.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#333',
                        fontSize: '18px',
                        lineHeight: 1.3,
                        flexGrow: 1,
                        pr: 1
                      }}
                    >
                      {module.title}
                    </Typography>
                    {isModuleCompleted(module.id) && (
                      <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      mb: 2,
                      flexGrow: 1,
                      fontSize: '14px',
                      lineHeight: 1.6,
                      height: '4.8em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {module.description}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Chip
                      label={module.category || 'OTHER'}
                      size="small"
                      sx={{
                        backgroundColor: '#F8F2DE',
                        color: '#D84040',
                        fontWeight: 600,
                        fontSize: '11px',
                        height: '24px',
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666' }}>
                      <BookIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {module.read_time || '10 min'}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleViewModule(module)}
                    sx={{
                      backgroundColor: isModuleCompleted(module.id) ? '#4caf50' : '#D84040',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 500,
                      borderRadius: '4px',
                      padding: '8px 16px',
                      '&:hover': {
                        backgroundColor: isModuleCompleted(module.id) ? '#388e3c' : '#A31D1D',
                      },
                    }}
                  >
                    {isModuleCompleted(module.id) ? 'Review Module' : 'View Module'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    );
  };

  // Render FAQs Tab
  const renderFAQsTab = () => {
    return (
      <Paper
        sx={{
          p: 3,
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: '10px',
          border: '1px solid #ffff',
          marginTop: '10px'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#333',
            mb: 3,
          }}
        >
          Frequently Asked Questions
        </Typography>

        {faqsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography sx={{ color: '#666' }}>Loading FAQs...</Typography>
          </Box>
        ) : faqs.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography sx={{ color: '#666' }}>No FAQs available at the moment.</Typography>
          </Box>
        ) : (
          <Box>
            {faqs.map((faq) => (
              <Accordion
                key={faq.faq_id}
                sx={{
                  mb: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  '&:before': {
                    display: 'none',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: '#f9fafb',
                    '&:hover': {
                      backgroundColor: '#f3f4f6',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography sx={{ fontWeight: 500, color: '#333', flex: 1 }}>
                      {faq.question}
                    </Typography>
                    {faq.category && (
                      <Chip
                        label={faq.category}
                        size="small"
                        sx={{
                          backgroundColor: '#F8F2DE',
                          color: '#D84040',
                          fontWeight: 600,
                          fontSize: '11px',
                          height: '24px',
                        }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ color: '#666', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Paper>
    );
  };

  // Render Forum Tab
  const renderForumTab = () => {
    const filteredThreads = getFilteredThreads();

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
              
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  mb: 1,
                  fontSize: '18px'
                }}
              >
                {thread.title}
              </Typography>
              
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
      const replies = forumPosts.filter(p => p.parent_post_id === post.post_id);
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
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                
                {replies.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => togglePostExpand(post.post_id)}
                    sx={{ ml: 'auto', textTransform: 'none' }}
                  >
                    {isExpanded ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
          
          {isExpanded && replies.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {replies.map(reply => renderPost(reply, true))}
            </Box>
          )}
        </Box>
      );
    };

    return (
      <Paper
        sx={{
          p: 3,
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: '10px',
          border: '1px solid #ffff',
          marginTop: '10px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#333',
            }}
          >
            Community Forum
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowNewThreadDialog(true)}
            sx={{
              backgroundColor: '#D84040',
              color: 'white',
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '4px',
              padding: '8px 16px',
              '&:hover': {
                backgroundColor: '#A31D1D',
              },
            }}
          >
            New Discussion
          </Button>
        </Box>

        <Box
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: '#F8F2DE',
            borderLeft: '4px solid #D84040',
            borderRadius: '4px',
          }}
        >
          <Typography sx={{ color: '#333', fontSize: '14px' }}>
            <strong>Community Guidelines:</strong> This is a safe space for sharing experiences and
            support. Please be respectful and maintain confidentiality.
          </Typography>
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
              value={forumFilterCategory}
              onChange={(e, val) => setForumFilterCategory(val)}
              sx={{ minHeight: '40px' }}
            >
              <Tab label="All" value="all" sx={{ minHeight: '40px', textTransform: 'none' }} />
              <Tab label="General" value="general" sx={{ minHeight: '40px', textTransform: 'none' }} />
              <Tab label="Health" value="health" sx={{ minHeight: '40px', textTransform: 'none' }} />
              <Tab label="Support" value="support" sx={{ minHeight: '40px', textTransform: 'none' }} />
            </Tabs>
          </Box>
        </Card>

        {/* Threads List */}
        {forumLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredThreads.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#666', mb: 2 }}>
              No discussions found. Start a new one!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewThreadDialog(true)}
              sx={{
                backgroundColor: '#D84040',
                color: 'white',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#A31D1D' }
              }}
            >
              Create Discussion
            </Button>
          </Card>
        ) : (
          <Box>
            {filteredThreads.map(thread => renderThreadCard(thread))}
          </Box>
        )}

        {/* New Thread Dialog */}
        <Dialog
          open={showNewThreadDialog}
          onClose={() => setShowNewThreadDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Start a New Discussion
            </Typography>
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
                backgroundColor: '#D84040',
                '&:hover': { backgroundColor: '#A31D1D' }
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
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {selectedThread.title}
                    </Typography>
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
                  Responses ({forumPosts.filter(p => !p.parent_post_id).length})
                </Typography>
                
                {forumPosts.filter(p => !p.parent_post_id).map(post => renderPost(post))}
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
                      backgroundColor: '#D84040',
                      minWidth: '100px',
                      '&:hover': { backgroundColor: '#A31D1D' }
                    }}
                  >
                    Post
                  </Button>
                </Box>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Paper>
    );
  };

  // Render Module Modal with Stepper
  const renderModuleModal = () => {
    if (!showModuleModal || !selectedModule) return null;

    const steps = [
      { label: 'Overview', icon: <BookIcon /> },
      { label: 'Content', icon: <SchoolIcon /> },
      { label: 'Resources', icon: <LinkIcon /> }
    ];

    return (
      <Dialog
        open={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
            {selectedModule.title}
          </Typography>
          <IconButton
            onClick={() => setShowModuleModal(false)}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 10, mt: 5 }}>
          <Stepper activeStep={moduleStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.label} completed={isStepCompleted(selectedModule.id, index)}>
                <StepLabel
                  onClick={() => setModuleStep(index)}
                  sx={{ cursor: 'pointer' }}
                  icon={
                    <Box sx={{ 
                      color: isStepCompleted(selectedModule.id, index) ? '#4caf50' : 
                            moduleStep === index ? '#D84040' : '#cccccc'
                    }}
                    >
                      {step.icon}
                    </Box>
                  }
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {moduleStep === 0 && (
            <Box sx={{ mt: 4 }}>
              <Box
                sx={{
                  backgroundColor: getModuleIconColor(selectedModule.category),
                  p: 3,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 4,
                  minHeight: '150px',
                }}
              >
                {getModuleIcon(selectedModule.category)}
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  mb: 2,
                  fontSize: '20px',
                  lineHeight: 1.4,
                }}
              >
                {selectedModule.title}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#666', 
                  mb: 3,
                  lineHeight: 1.8,
                  fontSize: '16px',
                  paragraph: true
                }}
              >
                {selectedModule.description}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Chip
                  label={selectedModule.category || 'OTHER'}
                  size="small"
                  sx={{
                    backgroundColor: '#F8F2DE',
                    color: '#D84040',
                    fontWeight: 600,
                    fontSize: '11px',
                    height: '24px',
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666' }}>
                  <BookIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {selectedModule.read_time || '10 min'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {moduleStep === 1 && (
            <Box sx={{ mt: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  mb: 3,
                  fontSize: '20px',
                  lineHeight: 1.4
                }}
              >
                Learning Content
              </Typography>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  maxHeight: '400px',
                  overflow: 'auto',
                  '& p': {
                    marginBottom: '16px',
                    marginTop: '16px',
                    lineHeight: 1.8,
                    fontSize: '16px',
                    color: '#333',
                    textAlign: 'justify',
                    textIndent: '1.5em',
                    hyphens: 'auto',
                  },
                  '& p:first-of-type': {
                    marginTop: 0,
                  },
                  '& p:last-child': {
                    marginBottom: 0,
                  },
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    marginTop: '24px',
                    marginBottom: '16px',
                    fontWeight: 600,
                    color: '#333',
                  },
                  '& h1': { fontSize: '28px' },
                  '& h2': { fontSize: '24px' },
                  '& h3': { fontSize: '20px' },
                  '& h4': { fontSize: '18px' },
                  '& h5': { fontSize: '16px' },
                  '& h6': { fontSize: '14px' },
                  '& ul, & ol': {
                    marginBottom: '16px',
                    paddingLeft: '24px',
                  },
                  '& li': {
                    marginBottom: '8px',
                    lineHeight: 1.6,
                  },
                  '& blockquote': {
                    borderLeft: '4px solid #e0e0e0',
                    paddingLeft: '16px',
                    margin: '16px 0',
                    fontStyle: 'italic',
                    color: '#666',
                  },
                  '& code': {
                    backgroundColor: '#f0f0f0',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  },
                  '& pre': {
                    backgroundColor: '#f0f0f0',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    marginBottom: '16px',
                  },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    marginBottom: '16px',
                  },
                  '& th, & td': {
                    border: '1px solid #e0e0e0',
                    padding: '8px 12px',
                    textAlign: 'left',
                  },
                  '& th': {
                    backgroundColor: '#f0f0f0',
                    fontWeight: 600,
                  },
                  '& a': {
                    color: '#D84040',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '16px auto',
                  },
                  '& strong, & b': {
                    fontWeight: 600,
                  },
                  '& em, & i': {
                    fontStyle: 'italic',
                  },
                  '& hr': {
                    border: 'none',
                    borderTop: '1px solid #e0e0e0',
                    margin: '24px 0',
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html: formatContent(selectedModule.content)
                }}
              />
            </Box>
          )}

          {moduleStep === 2 && (
            <Box sx={{ mt: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  mb: 3,
                  fontSize: '20px',
                  lineHeight: 1.4
                }}
              >
                External Resources
              </Typography>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: '#d4edda',
                  borderLeft: '4px solid #28a745',
                  borderRadius: '4px',
                  mb: 3,
                }}
              >
                <Typography 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#155724', 
                    mb: 2,
                    fontSize: '16px',
                    lineHeight: 1.6
                  }}
                >
                  Additional Learning Materials:
                </Typography>
                <Typography 
                  sx={{ 
                    color: '#155724', 
                    mb: 3,
                    fontSize: '16px',
                    lineHeight: 1.8
                  }}
                >
                  This module links to external resources for further learning. Click the button below to access them.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<OpenInNewIcon />}
                  href={selectedModule.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    backgroundColor: '#D84040',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#A31D1D',
                    },
                  }}
                >
                  Open External Resource
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: '1px solid #e5e7eb',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handlePrevStep}
              disabled={moduleStep === 0}
              sx={{
                textTransform: 'none',
                borderColor: '#d0d0d0',
                color: '#333',
              }}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              onClick={handleNextStep}
              disabled={moduleStep === 2}
              sx={{
                textTransform: 'none',
                borderColor: '#d0d0d0',
                color: '#333',
              }}
            >
              Next
            </Button>
          </Box>
          <Button
            variant="contained"
            onClick={handleMarkAsComplete}
            sx={{
              backgroundColor: '#4caf50',
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#388e3c',
              },
            }}
          >
            Mark as Complete
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render Add Module Modal
  const renderAddModuleModal = () => {
    return (
      <Dialog
        open={showAddModuleModal}
        onClose={() => setShowAddModuleModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(216, 64, 64, 0.15)'
          }
        }}
      >
        {/* Professional Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #D84040 0%, #A31D1D 100%)',
            p: 3,
            color: 'white',
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: '24px' }}>
                Add New Learning Module
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '14px' }}>
                Extract content from any webpage to create an interactive learning module
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setShowAddModuleModal(false);
                resetModuleForm();
              }}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {/* Theme-colored progress bar */}
          {moduleFormLoading && (
            <LinearProgress 
              variant="determinate" 
              value={extractionProgress} 
              sx={{ 
                height: 4,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #D84040, #A31D1D)',
                }
              }}
            />
          )}

          <Box sx={{ p: 4 }}>
            {/* Theme-colored info alert */}
            <Alert 
              severity="info" 
              sx={{ 
                mb: 4, 
                borderRadius: '8px',
                backgroundColor: '#F8F2DE',
                color: '#000000',
                '& .MuiAlert-icon': {
                  fontSize: 20,
                  color: '#000000'
                },
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Content Extraction
              </Typography>
              <Typography variant="body2">
                System automatically extract title, description, content, and calculate reading time from provided URL.
              </Typography>
            </Alert>

            {/* Main form section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                mb: 3, 
                color: '#333',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <MagicIcon sx={{ fontSize: 22, color: '#D84040' }} />
                Content Source
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Webpage URL *"
                    value={moduleLink}
                    onChange={(e) => setModuleLink(e.target.value)}
                    required
                    placeholder="https://example.com/article"
                    disabled={moduleFormLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon sx={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        height: '56px',
                        fontSize: '16px',
                        '&:hover fieldset': {
                          borderColor: '#D84040',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#D84040',
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '16px',
                        color: '#666',
                        '&.Mui-focused': {
                          color: '#D84040',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      fontSize: '16px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#D84040',
                      }
                    }}>Category</InputLabel>
                    <Select
                      value={moduleCategory}
                      label="Category"
                      onChange={(e) => setModuleCategory(e.target.value)}
                      disabled={moduleFormLoading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          height: '56px',
                          fontSize: '16px',
                        },
                      }}
                    >
                      <MenuItem value="BASICS">BASICS</MenuItem>
                      <MenuItem value="LIFESTYLE">LIFESTYLE</MenuItem>
                      <MenuItem value="TREATMENT">TREATMENT</MenuItem>
                      <MenuItem value="PREVENTION">PREVENTION</MenuItem>
                      <MenuItem value="OTHER">OTHER</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Read Time"
                    value={moduleReadTime || 'Auto-calculated'}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BookIcon sx={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        height: '56px',
                        fontSize: '16px',
                        backgroundColor: '#f8f9fa',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '16px',
                        color: '#666',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4, borderColor: '#e0e0e0' }} />

            {/* Preview section */}
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                mb: 3, 
                color: '#333',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <InfoIcon sx={{ fontSize: 22, color: '#666' }} />
                Extracted Information
              </Typography>
              
              <Box sx={{ 
                p: 3, 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                border: '2px dashed #F8F2DE',
                minHeight: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}>
                {moduleFormLoading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    flexDirection: 'column',
                    textAlign: 'center'
                  }}>
                    <CircularProgress size={24} thickness={4} sx={{ color: '#D84040' }} />
                    <Typography variant="body2" color="#666" sx={{ fontWeight: 500 }}>
                      Extracting content... {extractionProgress}%
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="#999" sx={{ 
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    Content preview will appear here after extraction
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#fafafa'
        }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowAddModuleModal(false);
              resetModuleForm();
            }}
            disabled={moduleFormLoading}
            sx={{
              textTransform: 'none',
              borderColor: '#d0d0d0',
              color: '#666',
              borderRadius: '8px',
              px: 3,
              py: 1,
              fontSize: '16px',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#D84040',
                color: '#D84040',
                backgroundColor: 'rgba(216, 64, 64, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddModule}
            disabled={moduleFormLoading || !moduleLink}
            startIcon={moduleFormLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
            sx={{
              background: 'linear-gradient(135deg, #D84040 0%, #A31D1D 100%)',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
              py: 1,
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(216, 64, 64, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #A31D1D 0%, #7a1515 100%)',
                boxShadow: '0 6px 16px rgba(216, 64, 64, 0.4)',
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e',
                boxShadow: 'none'
              }
            }}
          >
            {moduleFormLoading ? 'Extracting...' : 'Extract & Add Module'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render Edit Module Modal
  const renderEditModuleModal = () => {
    return (
      <Dialog
        open={showEditModuleModal}
        onClose={() => setShowEditModuleModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(216, 64, 64, 0.15)'
          }
        }}
      >
        {/* Professional Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #D84040 0%, #A31D1D 100%)',
            p: 3,
            color: 'white',
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: '24px' }}>
                Edit Learning Module
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '14px' }}>
                Update module information and content
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setShowEditModuleModal(false);
                resetModuleForm();
              }}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 4 }}>
          {/* Theme-colored progress bar */}
          {moduleFormLoading && (
            <LinearProgress 
              variant="indeterminate" 
              sx={{ 
                height: 4,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #D84040, #A31D1D)',
                }
              }}
            />
          )}

          {/* Individual form fields with proper spacing */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Webpage URL *"
              value={moduleLink}
              onChange={(e) => setModuleLink(e.target.value)}
              required
              disabled={moduleFormLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '50px',
                  fontSize: '15px',
                  '&:hover fieldset': {
                    borderColor: '#D84040',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#D84040',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '15px',
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#D84040',
                  }
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Category"
              value={moduleCategory}
              onChange={(e) => setModuleCategory(e.target.value)}
              disabled={moduleFormLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '50px',
                  fontSize: '15px',
                  '&:hover fieldset': {
                    borderColor: '#D84040',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#D84040',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '15px',
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#D84040',
                  }
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Read Time"
              value={moduleReadTime}
              onChange={(e) => setModuleReadTime(e.target.value)}
              placeholder="e.g., 10 min"
              disabled={moduleFormLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BookIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '50px',
                  fontSize: '15px',
                  '&:hover fieldset': {
                    borderColor: '#D84040',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#D84040',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '15px',
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#D84040',
                  }
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Title"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              disabled={moduleFormLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '50px',
                  fontSize: '15px',
                  '&:hover fieldset': {
                    borderColor: '#D84040',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#D84040',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '15px',
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#D84040',
                  }
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
              disabled={moduleFormLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontSize: '15px',
                  '&:hover fieldset': {
                    borderColor: '#D84040',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#D84040',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '15px',
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#D84040',
                  }
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Learning Content"
              multiline
              rows={6}
              value={moduleContent}
              onChange={(e) => setModuleContent(e.target.value)}
              disabled={moduleFormLoading}
              helperText="Override automatically extracted content here."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontSize: '15px',
                  '&:hover fieldset': {
                    borderColor: '#D84040',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#D84040',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '15px',
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#D84040',
                  }
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#fafafa'
        }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowEditModuleModal(false);
              resetModuleForm();
            }}
            disabled={moduleFormLoading}
            sx={{
              textTransform: 'none',
              borderColor: '#d0d0d0',
              color: '#666',
              borderRadius: '8px',
              px: 3,
              py: 1,
              fontSize: '15px',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#D84040',
                color: '#D84040',
                backgroundColor: 'rgba(216, 64, 64, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateModule}
            disabled={moduleFormLoading}
            startIcon={moduleFormLoading ? <CircularProgress size={20} /> : <EditIcon />}
            sx={{
              background: 'linear-gradient(135deg, #D84040 0%, #A31D1D 100%)',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
              py: 1,
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(216, 64, 64, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #A31D1D 0%, #7a1515 100%)',
                boxShadow: '0 6px 16px rgba(216, 64, 64, 0.4)',
              },
// ... (previous code continues from where it was cut off)

              '&:disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e',
                boxShadow: 'none'
              }
            }}
          >
            {moduleFormLoading ? 'Updating...' : 'Update Module'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render New Post Modal
  const renderNewPostModal = () => {
    if (!showNewPostModal) return null;

    return (
      <Dialog
        open={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
            New Forum Post
          </Typography>
          <IconButton
            onClick={() => {
              setShowNewPostModal(false);
              setPostTitle('');
              setPostContentLegacy('');
              setPostAnonymously(true);
            }}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
              Title <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              fullWidth
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Enter post title"
              required
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
              Content <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={postContentLegacy}
              onChange={(e) => setPostContentLegacy(e.target.value)}
              placeholder="Enter post content"
              required
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={postAnonymously}
                onChange={(e) => setPostAnonymously(e.target.checked)}
              />
            }
            label="Post anonymously"
          />
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              setShowNewPostModal(false);
              setPostTitle('');
              setPostContentLegacy('');
              setPostAnonymously(true);
            }}
            sx={{
              textTransform: 'none',
              borderColor: '#d0d0d0',
              color: '#333',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitPost}
            sx={{
              backgroundColor: '#D84040',
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#A31D1D',
              },
            }}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render Post View Modal
  const renderPostModal = () => {
    if (!showPostModal || !selectedPost) return null;

    return (
      <Dialog
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
            Forum Discussion
          </Typography>
          <IconButton
            onClick={() => setShowPostModal(false)}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box
            sx={{
              p: 2,
              backgroundColor: '#F8F2DE',
              borderLeft: '4px solid #D84040',
              borderRadius: '4px',
              mb: 3,
            }}
          >
            <Typography sx={{ color: '#333', fontSize: '14px' }}>
              This is a simulated community forum post. In a production environment, this would
              display full discussion thread.
            </Typography>
          </Box>
          <Typography sx={{ color: '#666' }}>Post content and replies would be displayed here.</Typography>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setShowPostModal(false)}
            sx={{
              textTransform: 'none',
              borderColor: '#d0d0d0',
              color: '#333',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <div style={{ 
      flexGrow: 1,
      padding: '20px', 
      minHeight: '100vh',
      marginTop: '80px'
    }}>
      <div style={{ 
        marginBottom: '24px', 
        background: 'linear-gradient(to right, #D84040, #A31D1D)', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Education</h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>Learn about HIV management, treatment options, and prevention strategies</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <Box
        sx={{
          display: 'flex',
          background: '#ffffff',
          padding: '12px 20px',
          gap: '24px',
          borderBottom: '1px solid #bdbdbd',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <Typography
          onClick={() => setActiveTab('modules')}
          sx={{
            color: activeTab === 'modules' ? '#D84040' : '#666',
            fontWeight: 500,
            cursor: 'pointer',
            borderBottom: activeTab === 'modules' ? '2px solid #D84040' : 'none',
            paddingBottom: '4px',
            '&:hover': {
              color: '#D84040',
            },
          }}
        >
          Learning Modules
        </Typography>
        <Typography
          onClick={() => setActiveTab('faqs')}
          sx={{
            color: activeTab === 'faqs' ? '#D84040' : '#666',
            fontWeight: 500,
            cursor: 'pointer',
            borderBottom: activeTab === 'faqs' ? '2px solid #D84040' : 'none',
            paddingBottom: '4px',
            '&:hover': {
              color: '#D84040',
            },
          }}
        >
          FAQs
        </Typography>
        <Typography
          onClick={() => setActiveTab('forum')}
          sx={{
            color: activeTab === 'forum' ? '#D84040' : '#666',
            fontWeight: 500,
            cursor: 'pointer',
            borderBottom: activeTab === 'forum' ? '2px solid #D84040' : 'none',
            paddingBottom: '4px',
            '&:hover': {
              color: '#D84040',
            },
          }}
        >
          Community Forum
        </Typography>
      </Box>

      {/* Tab Content */}
      <Box>
        {activeTab === 'modules' && renderModulesTab()}
        {activeTab === 'faqs' && renderFAQsTab()}
        {activeTab === 'forum' && renderForumTab()}
      </Box>

      {/* Modals */}
      {renderModuleModal()}
      {renderAddModuleModal()}
      {renderEditModuleModal()}
      {renderNewPostModal()}
      {renderPostModal()}

      {/* Toast Notification */}
      {toast && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor:
              toast.type === 'success'
                ? '#4caf50'
                : toast.type === 'error'
                ? '#f44336'
                : '#D84040',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease',
            zIndex: 9999,
          }}
        >
          <Typography sx={{ fontSize: '14px' }}>{toast.message}</Typography>
        </Box>
      )}
    </div>
  );
};

export default Education;