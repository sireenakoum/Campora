import React, { useEffect, useState } from 'react';

import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Compass,
  CornerDownRight,
  Edit3,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  X
} from 'lucide-react';

import { supabase } from '../lib/supabase';


// =========================================================
// MAJORS
// =========================================================

const MAJORS = [
  'Computer Science',
  'Business / Finance',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Biology',
  'Architecture',
  'Economics',
  'Psychology'
];


// =========================================================
// EMPTY VALUES
// =========================================================

const EMPTY_SWAP = {
  haveCourse: '',
  haveCrn: '',
  haveCourseName: '',
  haveSection: '',
  haveProf: '',
  haveDays: '',
  haveTime: '',

  wantCourse: '',
  wantCrn: '',
  wantCourseName: '',
  wantSection: '',
  wantProf: '',
  wantDays: '',
  wantTime: '',

  isAnonymous: false
};


const EMPTY_REVIEW = {
  crn: '',
  course_code: '',
  course_name: '',
  section: '',
  professor_name: '',
  meeting_days: '',
  meeting_time: '',
  semester: '',
  rating: 5,
  difficulty: 3,
  comment: '',
  is_anonymous: false
};


const EMPTY_QUESTION = {
  title: '',
  content: '',
  is_anonymous: false
};


const EMPTY_REMINDER = {
  crn: '',
  course_code: '',
  course_name: '',
  section: '',
  professor: ''
};


// =========================================================
// COMPONENT
// =========================================================

export default function Registration() {
  const [activeTab, setActiveTab] = useState('match');

  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [userName, setUserName] = useState('Student');


  // =======================================================
  // SWAPS
  // =======================================================

  const [swapPosts, setSwapPosts] = useState([]);

  const [searchPref, setSearchPref] = useState(EMPTY_SWAP);

  const [isMatchModalOpen, setIsMatchModalOpen] =
    useState(false);

  const [matchResult, setMatchResult] = useState(null);

  const [editingPostId, setEditingPostId] =
    useState(null);


  // =======================================================
  // REVIEWS
  // =======================================================

  const [reviews, setReviews] = useState([]);

  const [reviewReplies, setReviewReplies] = useState([]);

  const [isReviewModalOpen, setIsReviewModalOpen] =
    useState(false);

  const [newReview, setNewReview] =
    useState(EMPTY_REVIEW);

  const [editingReviewId, setEditingReviewId] =
    useState(null);

  const [replyingToReviewId, setReplyingToReviewId] =
    useState(null);

  const [reviewReplyText, setReviewReplyText] =
    useState('');

  const [editingReviewReplyId, setEditingReviewReplyId] =
    useState(null);

  const [
    editingReviewReplyText,
    setEditingReviewReplyText
  ] = useState('');


  // =======================================================
  // CURRICULUM + MAJOR Q&A
  // =======================================================

  const [selectedMajor, setSelectedMajor] =
    useState(MAJORS[0]);

  const [majorQuestions, setMajorQuestions] =
    useState([]);

  const [questionReplies, setQuestionReplies] =
    useState([]);

  const [newQuestion, setNewQuestion] =
    useState(EMPTY_QUESTION);

  const [editingQuestionId, setEditingQuestionId] =
    useState(null);

  const [replyingToQId, setReplyingToQId] =
    useState(null);

  const [replyText, setReplyText] = useState('');

  const [
    editingQuestionReplyId,
    setEditingQuestionReplyId
  ] = useState(null);

  const [
    editingQuestionReplyText,
    setEditingQuestionReplyText
  ] = useState('');


  // =======================================================
  // REMINDERS
  // =======================================================

  const [reminders, setReminders] = useState([]);

  const [newReminder, setNewReminder] =
    useState(EMPTY_REMINDER);

  const [editingReminderId, setEditingReminderId] =
    useState(null);


  // =======================================================
  // DIRECT MESSAGES
  // =======================================================

  const [activeDmUser, setActiveDmUser] =
    useState(null);

  const [dmMessages, setDmMessages] = useState([]);

  const [dmMessage, setDmMessage] = useState('');

  const [dmLoading, setDmLoading] = useState(false);


  // =======================================================
  // INITIAL DATA
  // =======================================================

  useEffect(() => {
    loadRegistrationData();
  }, []);


  useEffect(() => {
    if (activeDmUser && currentUserId) {
      fetchConversation();
    } else {
      setDmMessages([]);
    }
  }, [activeDmUser, currentUserId]);


  // =======================================================
  // HELPERS
  // =======================================================

  const showError = (message, error) => {
    console.error(message, error);

    alert(
      error?.message
        ? `${message}\n${error.message}`
        : message
    );
  };


  const formatDate = date => {
    if (!date) return '';

    return new Date(date).toLocaleDateString();
  };


  const canMessageUser = (
    userId,
    isAnonymous = false,
    status = 'available'
  ) => {
    return (
      Boolean(userId) &&
      userId !== currentUserId &&
      !isAnonymous &&
      status !== 'taken'
    );
  };


  const openDm = (
    id,
    name,
    isAnonymous = false,
    status = 'available'
  ) => {
    if (
      !canMessageUser(
        id,
        isAnonymous,
        status
      )
    ) {
      return;
    }

    setActiveDmUser({
      id,
      name: name || 'Student'
    });
  };


  // =======================================================
  // FETCH DATA
  // =======================================================

  const loadRegistrationData = async () => {
    try {
      setLoading(true);

      const {
        data: authData,
        error: authError
      } = await supabase.auth.getUser();


      if (authError) {
        throw authError;
      }


      const user = authData?.user;


      if (!user) {
        setLoading(false);
        return;
      }


      setCurrentUserId(user.id);


      const {
        data: profile
      } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();


      setUserName(
        profile?.name ||
        user.user_metadata?.name ||
        'Student'
      );


      const [
        swapsResult,
        reviewsResult,
        reviewRepliesResult,
        questionsResult,
        questionRepliesResult,
        remindersResult
      ] = await Promise.all([
        supabase
          .from('registration_swaps')
          .select('*')
          .order('created_at', {
            ascending: false
          }),

        supabase
          .from('course_reviews')
          .select('*')
          .order('created_at', {
            ascending: false
          }),

        supabase
          .from('course_review_replies')
          .select('*')
          .order('created_at', {
            ascending: true
          }),

        supabase
          .from('major_questions')
          .select('*')
          .order('created_at', {
            ascending: false
          }),

        supabase
          .from('major_question_replies')
          .select('*')
          .order('created_at', {
            ascending: true
          }),

        supabase
          .from('course_reminders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false
          })
      ]);


      if (swapsResult.error) {
        console.error(swapsResult.error);
      }

      if (reviewsResult.error) {
        console.error(reviewsResult.error);
      }

      if (reviewRepliesResult.error) {
        console.error(reviewRepliesResult.error);
      }

      if (questionsResult.error) {
        console.error(questionsResult.error);
      }

      if (questionRepliesResult.error) {
        console.error(questionRepliesResult.error);
      }

      if (remindersResult.error) {
        console.error(remindersResult.error);
      }


      setSwapPosts(swapsResult.data || []);

      setReviews(reviewsResult.data || []);

      setReviewReplies(
        reviewRepliesResult.data || []
      );

      setMajorQuestions(
        questionsResult.data || []
      );

      setQuestionReplies(
        questionRepliesResult.data || []
      );

      setReminders(
        remindersResult.data || []
      );

    } catch (error) {
      showError(
        'Could not load the Registration Hub.',
        error
      );
    } finally {
      setLoading(false);
    }
  };


  // =======================================================
  // SWAPS
  // =======================================================

  const handleFindOrPostMatch = async event => {
    event.preventDefault();


    if (
      !searchPref.haveCourse.trim() ||
      !searchPref.wantCourse.trim()
    ) {
      alert(
        'Please enter the course you currently have and the course you want.'
      );

      return;
    }


    // -----------------------------------------------------
    // EDIT EXISTING SWAP
    // -----------------------------------------------------

    if (editingPostId) {
      const payload = {
        have_course:
          searchPref.haveCourse
            .trim()
            .toUpperCase(),

        have_crn:
          searchPref.haveCrn.trim(),

        have_course_name:
          searchPref.haveCourseName.trim(),

        have_section:
          searchPref.haveSection.trim(),

        have_prof:
          searchPref.haveProf.trim(),

        have_days:
          searchPref.haveDays.trim(),

        have_time:
          searchPref.haveTime.trim(),

        want_course:
          searchPref.wantCourse
            .trim()
            .toUpperCase(),

        want_crn:
          searchPref.wantCrn.trim(),

        want_course_name:
          searchPref.wantCourseName.trim(),

        want_section:
          searchPref.wantSection.trim(),

        want_prof:
          searchPref.wantProf.trim(),

        want_days:
          searchPref.wantDays.trim(),

        want_time:
          searchPref.wantTime.trim(),

        is_anonymous:
          searchPref.isAnonymous,

        author_name:
          searchPref.isAnonymous
            ? 'Anonymous Student'
            : userName
      };


      const {
        data,
        error
      } = await supabase
        .from('registration_swaps')
        .update(payload)
        .eq('id', editingPostId)
        .eq('user_id', currentUserId)
        .select()
        .single();


      if (error) {
        showError(
          'Could not update your swap request.',
          error
        );

        return;
      }


      setSwapPosts(previous =>
        previous.map(post =>
          post.id === editingPostId
            ? data
            : post
        )
      );


      closeSwapModal();

      return;
    }


    // -----------------------------------------------------
    // MATCH ENGINE
    // -----------------------------------------------------

    const reciprocalMatch =
      swapPosts.find(post => {
        if (
          post.user_id === currentUserId ||
          post.status === 'taken'
        ) {
          return false;
        }


        const sameHave =
          post.have_course
            ?.trim()
            .toLowerCase() ===
          searchPref.wantCourse
            .trim()
            .toLowerCase();


        const sameWant =
          post.want_course
            ?.trim()
            .toLowerCase() ===
          searchPref.haveCourse
            .trim()
            .toLowerCase();


        if (!sameHave || !sameWant) {
          return false;
        }


        // If CRNs were provided, use them too.
        const wantedCrnMatches =
          !searchPref.wantCrn.trim() ||
          !post.have_crn ||
          post.have_crn.trim() ===
            searchPref.wantCrn.trim();


        const haveCrnMatches =
          !searchPref.haveCrn.trim() ||
          !post.want_crn ||
          post.want_crn.trim() ===
            searchPref.haveCrn.trim();


        // If sections were provided, use them too.
        const wantedSectionMatches =
          !searchPref.wantSection.trim() ||
          !post.have_section ||
          post.have_section
            .trim()
            .toLowerCase() ===
            searchPref.wantSection
              .trim()
              .toLowerCase();


        const haveSectionMatches =
          !searchPref.haveSection.trim() ||
          !post.want_section ||
          post.want_section
            .trim()
            .toLowerCase() ===
            searchPref.haveSection
              .trim()
              .toLowerCase();


        return (
          wantedCrnMatches &&
          haveCrnMatches &&
          wantedSectionMatches &&
          haveSectionMatches
        );
      });


    if (reciprocalMatch) {
      setMatchResult({
        found: true,
        post: reciprocalMatch
      });
    } else {
      setMatchResult({
        found: false
      });
    }
  };


  const handleConfirmPostMatch = async () => {
    if (!currentUserId) return;


    const payload = {
      user_id: currentUserId,

      author_name:
        searchPref.isAnonymous
          ? 'Anonymous Student'
          : userName,

      have_course:
        searchPref.haveCourse
          .trim()
          .toUpperCase(),

      have_crn:
        searchPref.haveCrn.trim(),

      have_course_name:
        searchPref.haveCourseName.trim(),

      have_section:
        searchPref.haveSection.trim(),

      have_prof:
        searchPref.haveProf.trim(),

      have_days:
        searchPref.haveDays.trim(),

      have_time:
        searchPref.haveTime.trim(),

      want_course:
        searchPref.wantCourse
          .trim()
          .toUpperCase(),

      want_crn:
        searchPref.wantCrn.trim(),

      want_course_name:
        searchPref.wantCourseName.trim(),

      want_section:
        searchPref.wantSection.trim(),

      want_prof:
        searchPref.wantProf.trim(),

      want_days:
        searchPref.wantDays.trim(),

      want_time:
        searchPref.wantTime.trim(),

      is_anonymous:
        searchPref.isAnonymous,

      status: 'available'
    };


    const {
      data,
      error
    } = await supabase
      .from('registration_swaps')
      .insert([payload])
      .select()
      .single();


    if (error) {
      showError(
        'Could not post your swap request.',
        error
      );

      return;
    }


    setSwapPosts(previous => [
      data,
      ...previous
    ]);


    closeSwapModal();
  };


  const handleEditSwap = post => {
    setEditingPostId(post.id);


    setSearchPref({
      haveCourse:
        post.have_course || '',

      haveCrn:
        post.have_crn || '',

      haveCourseName:
        post.have_course_name || '',

      haveSection:
        post.have_section || '',

      haveProf:
        post.have_prof || '',

      haveDays:
        post.have_days || '',

      haveTime:
        post.have_time || '',

      wantCourse:
        post.want_course || '',

      wantCrn:
        post.want_crn || '',

      wantCourseName:
        post.want_course_name || '',

      wantSection:
        post.want_section || '',

      wantProf:
        post.want_prof || '',

      wantDays:
        post.want_days || '',

      wantTime:
        post.want_time || '',

      isAnonymous:
        Boolean(post.is_anonymous)
    });


    setMatchResult(null);

    setIsMatchModalOpen(true);
  };


  const handleDeleteSwap = async id => {
    if (
      !window.confirm(
        'Delete this swap request?'
      )
    ) {
      return;
    }


    const { error } = await supabase
      .from('registration_swaps')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUserId);


    if (error) {
      showError(
        'Could not delete your swap request.',
        error
      );

      return;
    }


    setSwapPosts(previous =>
      previous.filter(
        post => post.id !== id
      )
    );
  };


  // -------------------------------------------------------
  // AVAILABLE / TAKEN
  // -------------------------------------------------------

  const handleToggleSwapStatus = async post => {
    const currentStatus =
      post.status || 'available';

    const nextStatus =
      currentStatus === 'taken'
        ? 'available'
        : 'taken';


    if (
      nextStatus === 'taken' &&
      !window.confirm(
        'Mark this swap as taken? Other students will see that it is no longer available.'
      )
    ) {
      return;
    }


    const {
      data,
      error
    } = await supabase
      .from('registration_swaps')
      .update({
        status: nextStatus
      })
      .eq('id', post.id)
      .eq('user_id', currentUserId)
      .select()
      .single();


    if (error) {
      showError(
        'Could not update the swap status.',
        error
      );

      return;
    }


    setSwapPosts(previous =>
      previous.map(item =>
        item.id === post.id
          ? data
          : item
      )
    );
  };


  const closeSwapModal = () => {
    setIsMatchModalOpen(false);

    setEditingPostId(null);

    setMatchResult(null);

    setSearchPref(EMPTY_SWAP);
  };


  // =======================================================
  // REVIEWS
  // =======================================================

  const openCreateReview = () => {
    setEditingReviewId(null);

    setNewReview(EMPTY_REVIEW);

    setIsReviewModalOpen(true);
  };


  const handleEditReview = review => {
    setEditingReviewId(review.id);

    setNewReview({
      crn: review.crn || '',
      course_code:
        review.course_code || '',
      course_name:
        review.course_name || '',
      section:
        review.section || '',
      professor_name:
        review.professor_name || '',
      meeting_days:
        review.meeting_days || '',
      meeting_time:
        review.meeting_time || '',
      semester:
        review.semester || '',
      rating:
        review.rating || 5,
      difficulty:
        review.difficulty || 3,
      comment:
        review.comment || '',
      is_anonymous:
        Boolean(review.is_anonymous)
    });

    setIsReviewModalOpen(true);
  };


  const closeReviewModal = () => {
    setIsReviewModalOpen(false);

    setEditingReviewId(null);

    setNewReview(EMPTY_REVIEW);
  };


  const handleSaveReview = async event => {
    event.preventDefault();

    if (!currentUserId) return;


    const payload = {
      user_id: currentUserId,

      author_name:
        newReview.is_anonymous
          ? 'Anonymous Student'
          : userName,

      crn:
        newReview.crn.trim(),

      course_code:
        newReview.course_code
          .trim()
          .toUpperCase(),

      course_name:
        newReview.course_name.trim(),

      section:
        newReview.section.trim(),

      professor_name:
        newReview.professor_name.trim(),

      meeting_days:
        newReview.meeting_days.trim(),

      meeting_time:
        newReview.meeting_time.trim(),

      semester:
        newReview.semester.trim(),

      rating:
        Number(newReview.rating),

      difficulty:
        Number(newReview.difficulty),

      comment:
        newReview.comment.trim(),

      is_anonymous:
        newReview.is_anonymous
    };


    if (editingReviewId) {
      const {
        data,
        error
      } = await supabase
        .from('course_reviews')
        .update(payload)
        .eq('id', editingReviewId)
        .eq('user_id', currentUserId)
        .select()
        .single();


      if (error) {
        showError(
          'Could not update your review.',
          error
        );

        return;
      }


      setReviews(previous =>
        previous.map(review =>
          review.id === editingReviewId
            ? data
            : review
        )
      );

    } else {
      const {
        data,
        error
      } = await supabase
        .from('course_reviews')
        .insert([payload])
        .select()
        .single();


      if (error) {
        showError(
          'Could not post your review.',
          error
        );

        return;
      }


      setReviews(previous => [
        data,
        ...previous
      ]);
    }


    closeReviewModal();
  };


  const handleDeleteReview = async id => {
    if (
      !window.confirm(
        'Delete this course review?'
      )
    ) {
      return;
    }


    const { error } = await supabase
      .from('course_reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUserId);


    if (error) {
      showError(
        'Could not delete your review.',
        error
      );

      return;
    }


    setReviews(previous =>
      previous.filter(
        review => review.id !== id
      )
    );


    setReviewReplies(previous =>
      previous.filter(
        reply => reply.review_id !== id
      )
    );
  };


  // =======================================================
  // REVIEW REPLIES
  // =======================================================

  const handleAddReviewReply = async reviewId => {
    if (!reviewReplyText.trim()) return;


    const payload = {
      review_id: reviewId,

      user_id: currentUserId,

      author_name: userName,

      content:
        reviewReplyText.trim()
    };


    const {
      data,
      error
    } = await supabase
      .from('course_review_replies')
      .insert([payload])
      .select()
      .single();


    if (error) {
      showError(
        'Could not post your reply.',
        error
      );

      return;
    }


    setReviewReplies(previous => [
      ...previous,
      data
    ]);


    setReviewReplyText('');

    setReplyingToReviewId(null);
  };


  const handleSaveReviewReplyEdit =
    async replyId => {
      if (
        !editingReviewReplyText.trim()
      ) {
        return;
      }


      const {
        data,
        error
      } = await supabase
        .from('course_review_replies')
        .update({
          content:
            editingReviewReplyText.trim()
        })
        .eq('id', replyId)
        .eq('user_id', currentUserId)
        .select()
        .single();


      if (error) {
        showError(
          'Could not update your reply.',
          error
        );

        return;
      }


      setReviewReplies(previous =>
        previous.map(reply =>
          reply.id === replyId
            ? data
            : reply
        )
      );


      setEditingReviewReplyId(null);

      setEditingReviewReplyText('');
    };


  const handleDeleteReviewReply =
    async replyId => {
      if (
        !window.confirm(
          'Delete this reply?'
        )
      ) {
        return;
      }


      const { error } = await supabase
        .from('course_review_replies')
        .delete()
        .eq('id', replyId)
        .eq('user_id', currentUserId);


      if (error) {
        showError(
          'Could not delete your reply.',
          error
        );

        return;
      }


      setReviewReplies(previous =>
        previous.filter(
          reply => reply.id !== replyId
        )
      );
    };


  // =======================================================
  // MAJOR QUESTIONS
  // =======================================================

  const handlePostQuestion = async event => {
    event.preventDefault();


    if (
      !newQuestion.title.trim() ||
      !newQuestion.content.trim()
    ) {
      return;
    }


    const payload = {
      user_id: currentUserId,

      major: selectedMajor,

      author_name:
        newQuestion.is_anonymous
          ? 'Anonymous Student'
          : userName,

      title:
        newQuestion.title.trim(),

      content:
        newQuestion.content.trim(),

      is_anonymous:
        newQuestion.is_anonymous
    };


    if (editingQuestionId) {
      const {
        data,
        error
      } = await supabase
        .from('major_questions')
        .update(payload)
        .eq('id', editingQuestionId)
        .eq('user_id', currentUserId)
        .select()
        .single();


      if (error) {
        showError(
          'Could not update your question.',
          error
        );

        return;
      }


      setMajorQuestions(previous =>
        previous.map(question =>
          question.id === editingQuestionId
            ? data
            : question
        )
      );


      setEditingQuestionId(null);

    } else {
      const {
        data,
        error
      } = await supabase
        .from('major_questions')
        .insert([payload])
        .select()
        .single();


      if (error) {
        showError(
          'Could not post your question.',
          error
        );

        return;
      }


      setMajorQuestions(previous => [
        data,
        ...previous
      ]);
    }


    setNewQuestion(EMPTY_QUESTION);
  };


  const handleEditQuestion = question => {
    setEditingQuestionId(question.id);

    setSelectedMajor(question.major);

    setNewQuestion({
      title:
        question.title || '',

      content:
        question.content || '',

      is_anonymous:
        Boolean(question.is_anonymous)
    });


    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };


  const handleDeleteQuestion = async id => {
    if (
      !window.confirm(
        'Delete this discussion question?'
      )
    ) {
      return;
    }


    const { error } = await supabase
      .from('major_questions')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUserId);


    if (error) {
      showError(
        'Could not delete your question.',
        error
      );

      return;
    }


    setMajorQuestions(previous =>
      previous.filter(
        question => question.id !== id
      )
    );


    setQuestionReplies(previous =>
      previous.filter(
        reply => reply.question_id !== id
      )
    );
  };


  // =======================================================
  // MAJOR QUESTION REPLIES
  // =======================================================

  const handleAddReply = async questionId => {
    if (!replyText.trim()) return;


    const payload = {
      question_id: questionId,

      user_id: currentUserId,

      author_name: userName,

      content:
        replyText.trim()
    };


    const {
      data,
      error
    } = await supabase
      .from('major_question_replies')
      .insert([payload])
      .select()
      .single();


    if (error) {
      showError(
        'Could not post your reply.',
        error
      );

      return;
    }


    setQuestionReplies(previous => [
      ...previous,
      data
    ]);


    setReplyText('');

    setReplyingToQId(null);
  };


  const handleSaveQuestionReplyEdit =
    async replyId => {
      if (
        !editingQuestionReplyText.trim()
      ) {
        return;
      }


      const {
        data,
        error
      } = await supabase
        .from('major_question_replies')
        .update({
          content:
            editingQuestionReplyText.trim()
        })
        .eq('id', replyId)
        .eq('user_id', currentUserId)
        .select()
        .single();


      if (error) {
        showError(
          'Could not update your reply.',
          error
        );

        return;
      }


      setQuestionReplies(previous =>
        previous.map(reply =>
          reply.id === replyId
            ? data
            : reply
        )
      );


      setEditingQuestionReplyId(null);

      setEditingQuestionReplyText('');
    };


  const handleDeleteQuestionReply =
    async replyId => {
      if (
        !window.confirm(
          'Delete this reply?'
        )
      ) {
        return;
      }


      const { error } = await supabase
        .from('major_question_replies')
        .delete()
        .eq('id', replyId)
        .eq('user_id', currentUserId);


      if (error) {
        showError(
          'Could not delete your reply.',
          error
        );

        return;
      }


      setQuestionReplies(previous =>
        previous.filter(
          reply => reply.id !== replyId
        )
      );
    };


  // =======================================================
  // REMINDERS
  // =======================================================

  const handleSaveReminder = async event => {
    event.preventDefault();


    if (!newReminder.course_code.trim()) {
      return;
    }


    const payload = {
      user_id: currentUserId,

      crn:
        newReminder.crn.trim(),

      course_code:
        newReminder.course_code
          .trim()
          .toUpperCase(),

      course_name:
        newReminder.course_name.trim(),

      section:
        newReminder.section.trim(),

      professor:
        newReminder.professor.trim(),

      is_active: true
    };


    if (editingReminderId) {
      const {
        data,
        error
      } = await supabase
        .from('course_reminders')
        .update(payload)
        .eq('id', editingReminderId)
        .eq('user_id', currentUserId)
        .select()
        .single();


      if (error) {
        showError(
          'Could not update your reminder.',
          error
        );

        return;
      }


      setReminders(previous =>
        previous.map(reminder =>
          reminder.id === editingReminderId
            ? data
            : reminder
        )
      );

    } else {
      const {
        data,
        error
      } = await supabase
        .from('course_reminders')
        .insert([payload])
        .select()
        .single();


      if (error) {
        showError(
          'Could not create your reminder.',
          error
        );

        return;
      }


      setReminders(previous => [
        data,
        ...previous
      ]);
    }


    setEditingReminderId(null);

    setNewReminder(EMPTY_REMINDER);
  };


  const handleEditReminder = reminder => {
    setEditingReminderId(reminder.id);

    setNewReminder({
      crn:
        reminder.crn || '',

      course_code:
        reminder.course_code || '',

      course_name:
        reminder.course_name || '',

      section:
        reminder.section || '',

      professor:
        reminder.professor || ''
    });


    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };


  const handleDeleteReminder =
    async id => {
      if (
        !window.confirm(
          'Delete this seat reminder?'
        )
      ) {
        return;
      }


      const { error } = await supabase
        .from('course_reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId);


      if (error) {
        showError(
          'Could not delete your reminder.',
          error
        );

        return;
      }


      setReminders(previous =>
        previous.filter(
          reminder => reminder.id !== id
        )
      );
    };


  const handleToggleReminder =
    async reminder => {
      const newStatus =
        !reminder.is_active;


      const {
        data,
        error
      } = await supabase
        .from('course_reminders')
        .update({
          is_active: newStatus
        })
        .eq('id', reminder.id)
        .eq('user_id', currentUserId)
        .select()
        .single();


      if (error) {
        showError(
          'Could not update reminder status.',
          error
        );

        return;
      }


      setReminders(previous =>
        previous.map(item =>
          item.id === reminder.id
            ? data
            : item
        )
      );
    };


  // =======================================================
  // DIRECT MESSAGES
  // =======================================================

  const fetchConversation = async () => {
    if (
      !activeDmUser ||
      !currentUserId
    ) {
      return;
    }


    setDmLoading(true);


    const {
      data,
      error
    } = await supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${activeDmUser.id}),and(sender_id.eq.${activeDmUser.id},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', {
        ascending: true
      });


    if (error) {
      console.error(error);

      setDmMessages([]);

      setDmLoading(false);

      return;
    }


    setDmMessages(data || []);

    setDmLoading(false);
  };


  const handleSendDirectMessage =
    async () => {
      if (
        !dmMessage.trim() ||
        !activeDmUser ||
        !currentUserId
      ) {
        return;
      }


      const payload = {
        sender_id: currentUserId,

        receiver_id:
          activeDmUser.id,

        message:
          dmMessage.trim()
      };


      const {
        data,
        error
      } = await supabase
        .from('direct_messages')
        .insert([payload])
        .select()
        .single();


      if (error) {
        showError(
          'Could not send your message.',
          error
        );

        return;
      }


      setDmMessages(previous => [
        ...previous,
        data
      ]);


      setDmMessage('');
    };


  const handleDeleteMessage =
    async message => {
      if (
        message.sender_id !==
        currentUserId
      ) {
        return;
      }


      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', message.id)
        .eq('sender_id', currentUserId);


      if (error) {
        showError(
          'Could not delete message.',
          error
        );

        return;
      }


      setDmMessages(previous =>
        previous.filter(
          item => item.id !== message.id
        )
      );
    };


  // =======================================================
  // FILTERED DATA
  // =======================================================

  const selectedMajorQuestions =
    majorQuestions.filter(
      question =>
        question.major === selectedMajor
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        paddingBottom: '60px'
      }}
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        style={{
          marginBottom: '30px'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border:
              '1.5px solid #E2E8F0',
            padding: '6px 14px',
            borderRadius: '30px',
            fontSize: '11px',
            fontWeight: '800',
            color: '#0B1A3F',
            marginBottom: '10px'
          }}
        >
          <Compass
            size={14}
            color="#0B1A3F"
          />

          ACADEMIC REGISTRATION HUB
        </div>


        <h1
          style={{
            fontSize: '36px',
            fontWeight: '900',
            color: '#0B1A3F',
            margin: 0,
            letterSpacing: '-0.5px'
          }}
        >
          Registration & Swap Hub
        </h1>


        <p
          style={{
            color: '#A3AED0',
            fontWeight: '700',
            marginTop: '6px',
            fontSize: '14px'
          }}
        >
          Match course sections, read course & professor
          reviews, manage seat alerts, explore curricula,
          and ask other students for advice.
        </p>
      </div>


      {/* ===================================================
          TABS
      =================================================== */}

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          overflowX: 'auto',
          paddingBottom: '5px'
        }}
      >
        <button
          onClick={() =>
            setActiveTab('match')
          }
          style={
            activeTab === 'match'
              ? activeTabBtn
              : inactiveTabBtn
          }
        >
          <ArrowLeftRight size={16} />

          Course Match & Swap
        </button>


        <button
          onClick={() =>
            setActiveTab('reviews')
          }
          style={
            activeTab === 'reviews'
              ? activeTabBtn
              : inactiveTabBtn
          }
        >
          <Star size={16} />

          Course & Prof Reviews
        </button>


        <button
          onClick={() =>
            setActiveTab('curriculum')
          }
          style={
            activeTab === 'curriculum'
              ? activeTabBtn
              : inactiveTabBtn
          }
        >
          <BookOpen size={16} />

          Curriculum
        </button>


        <button
          onClick={() =>
            setActiveTab('majorqa')
          }
          style={
            activeTab === 'majorqa'
              ? activeTabBtn
              : inactiveTabBtn
          }
        >
          <MessageSquare size={16} />

          Major Q&A
        </button>


        <button
          onClick={() =>
            setActiveTab('reminders')
          }
          style={
            activeTab === 'reminders'
              ? activeTabBtn
              : inactiveTabBtn
          }
        >
          <Bell size={16} />

          Seat Opening Reminders
        </button>
      </div>


      {/* ===================================================
          TAB 1 - COURSE MATCH & SWAP
      =================================================== */}

      {activeTab === 'match' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '25px'
          }}
        >

          <div
            style={{
              background: '#0B1A3F',
              color: 'white',
              padding: '30px',
              borderRadius: '24px',
              boxShadow:
                '0 10px 30px rgba(11,26,57,0.15)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '15px'
              }}
            >
              <Sparkles
                color="#FFFFFF"
                size={24}
              />

              <h2
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '800'
                }}
              >
                Find Your Ideal Course Match
              </h2>
            </div>


            <p
              style={{
                color: '#CBD5E1',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '25px',
                maxWidth: '760px',
                lineHeight: 1.6
              }}
            >
              Enter the exact course you currently have
              and the course you want, including CRN,
              section, professor and schedule. Campora
              will check for a reciprocal swap.
            </p>


            <button
              onClick={() => {
                setEditingPostId(null);
                setSearchPref(EMPTY_SWAP);
                setMatchResult(null);
                setIsMatchModalOpen(true);
              }}
              style={matchSearchBtn}
            >
              <Plus size={18} />

              Check Match / Post Swap Request
            </button>
          </div>


          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '15px'
              }}
            >
              <h3
                style={{
                  ...sectionHeading,
                  marginBottom: 0
                }}
              >
                Recent Swap Requests
              </h3>
            </div>


            {loading ? (
              <div style={loadingBox}>
                <RefreshCw size={20} />

                Loading...
              </div>
            ) : swapPosts.length === 0 ? (
              <div style={emptyCard}>
                No swap requests posted yet.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '20px'
                }}
              >
                {swapPosts.map(post => {
                  const isTaken =
                    post.status === 'taken';


                  return (
                    <div
                      key={post.id}
                      style={{
                        ...swapCard,
                        ...(isTaken
                          ? takenSwapCard
                          : {})
                      }}
                    >
                      {/* TOP ROW */}

                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'flex-start',
                          gap: '10px',
                          marginBottom:
                            '16px'
                        }}
                      >
                        <StudentIdentity
                          name={
                            post.author_name
                          }
                          isAnonymous={
                            post.is_anonymous
                          }
                          clickable={canMessageUser(
                            post.user_id,
                            post.is_anonymous,
                            post.status
                          )}
                          onClick={() =>
                            openDm(
                              post.user_id,
                              post.author_name,
                              post.is_anonymous,
                              post.status
                            )
                          }
                        />


                        <div
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: '8px'
                          }}
                        >
                          <span
                            style={
                              isTaken
                                ? takenStatusBadge
                                : availableStatusBadge
                            }
                          >
                            {isTaken
                              ? 'TAKEN'
                              : 'AVAILABLE'}
                          </span>


                          {post.user_id ===
                            currentUserId && (
                            <OwnerActions
                              onEdit={() =>
                                handleEditSwap(
                                  post
                                )
                              }
                              onDelete={() =>
                                handleDeleteSwap(
                                  post.id
                                )
                              }
                            />
                          )}
                        </div>
                      </div>


                      {/* HAVE */}

                      <div
                        style={{
                          ...swapCourseBlock,
                          ...(isTaken
                            ? {
                                opacity: 0.65
                              }
                            : {})
                        }}
                      >
                        <div
                          style={
                            swapCourseHeader
                          }
                        >
                          <span style={badgeRed}>
                            HAVE
                          </span>


                          {post.have_crn && (
                            <span
                              style={
                                smallCrnBadge
                              }
                            >
                              CRN{' '}
                              {post.have_crn}
                            </span>
                          )}
                        </div>


                        <h4
                          style={{
                            margin:
                              '10px 0 3px',
                            color:
                              '#0B1A3F',
                            fontSize:
                              '16px',
                            fontWeight:
                              '900'
                          }}
                        >
                          {post.have_course}
                        </h4>


                        {post.have_course_name && (
                          <p
                            style={
                              swapCourseName
                            }
                          >
                            {
                              post.have_course_name
                            }
                          </p>
                        )}


                        <div
                          style={
                            compactCourseInfoGrid
                          }
                        >
                          <InfoItem
                            label="SECTION"
                            value={
                              post.have_section
                            }
                          />

                          <InfoItem
                            label="PROFESSOR"
                            value={
                              post.have_prof
                            }
                          />

                          <InfoItem
                            label="DAYS"
                            value={
                              post.have_days
                            }
                          />

                          <InfoItem
                            label="TIME"
                            value={
                              post.have_time
                            }
                          />
                        </div>
                      </div>


                      {/* SWAP ARROW */}

                      <div
                        style={
                          swapArrowDivider
                        }
                      >
                        <div
                          style={
                            swapArrowCircle
                          }
                        >
                          <ArrowRight
                            size={16}
                          />
                        </div>
                      </div>


                      {/* WANTS */}

                      <div
                        style={{
                          ...swapCourseBlock,
                          ...(isTaken
                            ? {
                                opacity: 0.65
                              }
                            : {})
                        }}
                      >
                        <div
                          style={
                            swapCourseHeader
                          }
                        >
                          <span
                            style={badgeGreen}
                          >
                            WANTS
                          </span>


                          {post.want_crn && (
                            <span
                              style={
                                smallCrnBadge
                              }
                            >
                              CRN{' '}
                              {post.want_crn}
                            </span>
                          )}
                        </div>


                        <h4
                          style={{
                            margin:
                              '10px 0 3px',
                            color:
                              '#0B1A3F',
                            fontSize:
                              '16px',
                            fontWeight:
                              '900'
                          }}
                        >
                          {post.want_course}
                        </h4>


                        {post.want_course_name && (
                          <p
                            style={
                              swapCourseName
                            }
                          >
                            {
                              post.want_course_name
                            }
                          </p>
                        )}


                        <div
                          style={
                            compactCourseInfoGrid
                          }
                        >
                          <InfoItem
                            label="SECTION"
                            value={
                              post.want_section
                            }
                          />

                          <InfoItem
                            label="PROFESSOR"
                            value={
                              post.want_prof
                            }
                          />

                          <InfoItem
                            label="DAYS"
                            value={
                              post.want_days
                            }
                          />

                          <InfoItem
                            label="TIME"
                            value={
                              post.want_time
                            }
                          />
                        </div>
                      </div>


                      {/* TAKEN MESSAGE */}

                      {isTaken && (
                        <div
                          style={
                            takenNotice
                          }
                        >
                          <CheckCircle2
                            size={15}
                          />

                          This swap has already
                          been taken and is no
                          longer available.
                        </div>
                      )}


                      {/* OTHER STUDENT MESSAGE */}

                      {!isTaken &&
                        canMessageUser(
                          post.user_id,
                          post.is_anonymous,
                          post.status
                        ) && (
                          <button
                            onClick={() =>
                              openDm(
                                post.user_id,
                                post.author_name,
                                post.is_anonymous,
                                post.status
                              )
                            }
                            style={{
                              ...dmBtnStyle,
                              marginTop:
                                '15px'
                            }}
                          >
                            <MessageCircle
                              size={15}
                            />

                            Message Student
                          </button>
                        )}


                      {/* OWNER ACTION */}

                      {post.user_id ===
                        currentUserId && (
                        <button
                          onClick={() =>
                            handleToggleSwapStatus(
                              post
                            )
                          }
                          style={
                            isTaken
                              ? reopenSwapButton
                              : markTakenButton
                          }
                        >
                          {isTaken ? (
                            <>
                              <RotateCcw
                                size={14}
                              />

                              Make Available Again
                            </>
                          ) : (
                            <>
                              <CheckCircle2
                                size={14}
                              />

                              Mark as Taken
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ===================================================
          TAB 2 - REVIEWS
      =================================================== */}

      {activeTab === 'reviews' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '25px'
          }}
        >

          <div style={sectionTopRow}>
            <div>
              <h3
                style={{
                  ...sectionHeading,
                  marginBottom: '4px'
                }}
              >
                Course & Professor Feedback
              </h3>

              <p style={sectionDescription}>
                Share the exact course section and your
                experience with other students.
              </p>
            </div>


            <button
              onClick={openCreateReview}
              style={primaryActionBtn}
            >
              <Plus size={18} />

              Write Review
            </button>
          </div>


          {reviews.length === 0 ? (
            <div style={emptyCard}>
              No course reviews yet.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {reviews.map(review => {
                const replies =
                  reviewReplies.filter(
                    reply =>
                      reply.review_id ===
                      review.id
                  );


                return (
                  <div
                    key={review.id}
                    style={reviewCard}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        gap: '15px',
                        alignItems: 'flex-start'
                      }}
                    >
                      <StudentIdentity
                        name={
                          review.author_name
                        }
                        isAnonymous={
                          review.is_anonymous
                        }
                        clickable={canMessageUser(
                          review.user_id,
                          review.is_anonymous
                        )}
                        onClick={() =>
                          openDm(
                            review.user_id,
                            review.author_name,
                            review.is_anonymous
                          )
                        }
                      />


                      {review.user_id ===
                        currentUserId && (
                        <OwnerActions
                          onEdit={() =>
                            handleEditReview(
                              review
                            )
                          }
                          onDelete={() =>
                            handleDeleteReview(
                              review.id
                            )
                          }
                        />
                      )}
                    </div>


                    <div
                      style={{
                        marginTop: '16px'
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '19px',
                          fontWeight: '900',
                          color: '#0B1A3F'
                        }}
                      >
                        {review.course_code}

                        {review.course_name &&
                          ` — ${review.course_name}`}
                      </h4>


                      <p
                        style={{
                          margin:
                            '4px 0 0 0',
                          color: '#94A3B8',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}
                      >
                        Posted{' '}
                        {formatDate(
                          review.created_at
                        )}
                      </p>
                    </div>


                    <div style={courseInfoGrid}>
                      <InfoItem
                        label="CRN"
                        value={review.crn}
                      />

                      <InfoItem
                        label="COURSE CODE"
                        value={
                          review.course_code
                        }
                      />

                      <InfoItem
                        label="COURSE NAME"
                        value={
                          review.course_name
                        }
                      />

                      <InfoItem
                        label="SECTION"
                        value={review.section}
                      />

                      <InfoItem
                        label="PROFESSOR"
                        value={
                          review.professor_name
                        }
                      />

                      <InfoItem
                        label="DAYS"
                        value={
                          review.meeting_days
                        }
                      />

                      <InfoItem
                        label="TIME"
                        value={
                          review.meeting_time
                        }
                      />

                      <InfoItem
                        label="SEMESTER"
                        value={
                          review.semester
                        }
                      />
                    </div>


                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '15px'
                      }}
                    >
                      <span style={reviewTag}>
                        ★ Rating:{' '}
                        {review.rating}/5
                      </span>

                      <span
                        style={{
                          ...reviewTag,
                          background: '#FEE2E2',
                          color: '#DC2626'
                        }}
                      >
                        Difficulty:{' '}
                        {review.difficulty}/5
                      </span>
                    </div>


                    <p style={bodyText}>
                      {review.comment}
                    </p>


                    {replies.length > 0 && (
                      <div style={replySection}>
                        {replies.map(reply => (
                          <ReplyCard
                            key={reply.id}
                            reply={reply}
                            currentUserId={
                              currentUserId
                            }
                            editing={
                              editingReviewReplyId ===
                              reply.id
                            }
                            editingText={
                              editingReviewReplyText
                            }
                            onEditingTextChange={
                              setEditingReviewReplyText
                            }
                            onStartEdit={() => {
                              setEditingReviewReplyId(
                                reply.id
                              );

                              setEditingReviewReplyText(
                                reply.content
                              );
                            }}
                            onCancelEdit={() => {
                              setEditingReviewReplyId(
                                null
                              );

                              setEditingReviewReplyText(
                                ''
                              );
                            }}
                            onSaveEdit={() =>
                              handleSaveReviewReplyEdit(
                                reply.id
                              )
                            }
                            onDelete={() =>
                              handleDeleteReviewReply(
                                reply.id
                              )
                            }
                            onMessage={() =>
                              openDm(
                                reply.user_id,
                                reply.author_name
                              )
                            }
                          />
                        ))}
                      </div>
                    )}


                    <div
                      style={{
                        marginTop: '14px'
                      }}
                    >
                      {replyingToReviewId ===
                      review.id ? (
                        <ReplyComposer
                          value={
                            reviewReplyText
                          }
                          onChange={
                            setReviewReplyText
                          }
                          placeholder="Reply to this review..."
                          onSubmit={() =>
                            handleAddReviewReply(
                              review.id
                            )
                          }
                          onCancel={() => {
                            setReplyingToReviewId(
                              null
                            );

                            setReviewReplyText(
                              ''
                            );
                          }}
                        />
                      ) : (
                        <button
                          onClick={() =>
                            setReplyingToReviewId(
                              review.id
                            )
                          }
                          style={replyButton}
                        >
                          <CornerDownRight
                            size={14}
                          />

                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* ===================================================
          TAB 3 - CURRICULUM
      =================================================== */}

      {activeTab === 'curriculum' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={reviewCard}>
            <h3 style={sectionHeading}>
              Curriculum
            </h3>


            <p style={sectionDescription}>
              Select a major to view its official
              curriculum once it is uploaded.
            </p>


            <label style={fieldLabel}>
              SELECT MAJOR
            </label>


            <select
              value={selectedMajor}
              onChange={event =>
                setSelectedMajor(
                  event.target.value
                )
              }
              style={selectInputStyle}
            >
              {MAJORS.map(major => (
                <option
                  key={major}
                  value={major}
                >
                  {major}
                </option>
              ))}
            </select>


            <div
              style={{
                marginTop: '22px',
                padding: '45px 25px',
                border:
                  '1.5px dashed #CBD5E1',
                borderRadius: '20px',
                textAlign: 'center'
              }}
            >
              <BookOpen
                size={32}
                color="#A3AED0"
              />


              <h4
                style={{
                  margin:
                    '12px 0 5px',
                  fontSize: '18px',
                  fontWeight: '900',
                  color: '#0B1A3F'
                }}
              >
                {selectedMajor} Curriculum
              </h4>


              <p
                style={{
                  margin: 0,
                  color: '#94A3B8',
                  fontWeight: '800',
                  fontSize: '14px'
                }}
              >
                To be uploaded.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* ===================================================
          TAB 4 - MAJOR Q&A
      =================================================== */}

      {activeTab === 'majorqa' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '22px'
          }}
        >
          <div style={reviewCard}>
            <h3 style={sectionHeading}>
              Major Q&A & Student Advice
            </h3>


            <p style={sectionDescription}>
              Choose your major, ask questions, and get
              advice from other students.
            </p>


            <label style={fieldLabel}>
              SELECT MAJOR
            </label>


            <select
              value={selectedMajor}
              onChange={event => {
                setSelectedMajor(
                  event.target.value
                );

                setEditingQuestionId(
                  null
                );

                setNewQuestion(
                  EMPTY_QUESTION
                );
              }}
              style={selectInputStyle}
            >
              {MAJORS.map(major => (
                <option
                  key={major}
                  value={major}
                >
                  {major}
                </option>
              ))}
            </select>
          </div>


          <form
            onSubmit={handlePostQuestion}
            style={reviewCard}
          >
            <h4
              style={{
                margin: '0 0 14px 0',
                color: '#0B1A3F',
                fontWeight: '900'
              }}
            >
              {editingQuestionId
                ? 'Edit Question'
                : `Ask about ${selectedMajor}`}
            </h4>


            <input
              type="text"
              placeholder="Question title"
              required
              style={{
                ...modalInput,
                marginBottom: '10px'
              }}
              value={newQuestion.title}
              onChange={event =>
                setNewQuestion({
                  ...newQuestion,
                  title:
                    event.target.value
                })
              }
            />


            <textarea
              placeholder="Write your question or explain what advice you need..."
              required
              style={{
                ...modalInput,
                height: '95px',
                resize: 'vertical',
                marginBottom: '12px'
              }}
              value={
                newQuestion.content
              }
              onChange={event =>
                setNewQuestion({
                  ...newQuestion,
                  content:
                    event.target.value
                })
              }
            />


            <div style={formBottomRow}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={
                    newQuestion.is_anonymous
                  }
                  onChange={event =>
                    setNewQuestion({
                      ...newQuestion,
                      is_anonymous:
                        event.target.checked
                    })
                  }
                />

                Post anonymously
              </label>


              <div
                style={{
                  display: 'flex',
                  gap: '8px'
                }}
              >
                {editingQuestionId && (
                  <button
                    type="button"
                    style={secondaryActionBtn}
                    onClick={() => {
                      setEditingQuestionId(
                        null
                      );

                      setNewQuestion(
                        EMPTY_QUESTION
                      );
                    }}
                  >
                    Cancel
                  </button>
                )}


                <button
                  type="submit"
                  style={primaryActionBtn}
                >
                  {editingQuestionId
                    ? 'Save Changes'
                    : 'Post Question'}
                </button>
              </div>
            </div>
          </form>


          {selectedMajorQuestions.length ===
          0 ? (
            <div style={emptyCard}>
              No questions yet for{' '}
              {selectedMajor}.
            </div>
          ) : (
            selectedMajorQuestions.map(
              question => {
                const replies =
                  questionReplies.filter(
                    reply =>
                      reply.question_id ===
                      question.id
                  );


                return (
                  <div
                    key={question.id}
                    style={reviewCard}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'flex-start',
                        gap: '12px'
                      }}
                    >
                      <StudentIdentity
                        name={
                          question.author_name
                        }
                        isAnonymous={
                          question.is_anonymous
                        }
                        clickable={canMessageUser(
                          question.user_id,
                          question.is_anonymous
                        )}
                        onClick={() =>
                          openDm(
                            question.user_id,
                            question.author_name,
                            question.is_anonymous
                          )
                        }
                      />


                      {question.user_id ===
                        currentUserId && (
                        <OwnerActions
                          onEdit={() =>
                            handleEditQuestion(
                              question
                            )
                          }
                          onDelete={() =>
                            handleDeleteQuestion(
                              question.id
                            )
                          }
                        />
                      )}
                    </div>


                    <h4
                      style={{
                        margin:
                          '16px 0 5px',
                        color: '#0B1A3F',
                        fontWeight: '900',
                        fontSize: '17px'
                      }}
                    >
                      {question.title}
                    </h4>


                    <p
                      style={{
                        margin:
                          '0 0 12px 0',
                        fontSize: '11px',
                        color: '#A3AED0',
                        fontWeight: '700'
                      }}
                    >
                      {formatDate(
                        question.created_at
                      )}
                    </p>


                    <p style={bodyText}>
                      {question.content}
                    </p>


                    {replies.length > 0 && (
                      <div style={replySection}>
                        {replies.map(reply => (
                          <ReplyCard
                            key={reply.id}
                            reply={reply}
                            currentUserId={
                              currentUserId
                            }
                            editing={
                              editingQuestionReplyId ===
                              reply.id
                            }
                            editingText={
                              editingQuestionReplyText
                            }
                            onEditingTextChange={
                              setEditingQuestionReplyText
                            }
                            onStartEdit={() => {
                              setEditingQuestionReplyId(
                                reply.id
                              );

                              setEditingQuestionReplyText(
                                reply.content
                              );
                            }}
                            onCancelEdit={() => {
                              setEditingQuestionReplyId(
                                null
                              );

                              setEditingQuestionReplyText(
                                ''
                              );
                            }}
                            onSaveEdit={() =>
                              handleSaveQuestionReplyEdit(
                                reply.id
                              )
                            }
                            onDelete={() =>
                              handleDeleteQuestionReply(
                                reply.id
                              )
                            }
                            onMessage={() =>
                              openDm(
                                reply.user_id,
                                reply.author_name
                              )
                            }
                          />
                        ))}
                      </div>
                    )}


                    <div
                      style={{
                        marginTop: '14px'
                      }}
                    >
                      {replyingToQId ===
                      question.id ? (
                        <ReplyComposer
                          value={replyText}
                          onChange={
                            setReplyText
                          }
                          placeholder="Write your reply..."
                          onSubmit={() =>
                            handleAddReply(
                              question.id
                            )
                          }
                          onCancel={() => {
                            setReplyingToQId(
                              null
                            );

                            setReplyText('');
                          }}
                        />
                      ) : (
                        <button
                          style={replyButton}
                          onClick={() =>
                            setReplyingToQId(
                              question.id
                            )
                          }
                        >
                          <CornerDownRight
                            size={14}
                          />

                          Reply to Student
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      )}


      {/* ===================================================
          TAB 5 - REMINDERS
      =================================================== */}

      {activeTab === 'reminders' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '25px'
          }}
        >
          <div style={reviewCard}>
            <h3 style={sectionHeading}>
              Set Course Seat Alert
            </h3>


            <p style={sectionDescription}>
              Save the exact course or CRN you want
              Campora to monitor.
            </p>


            <form
              onSubmit={handleSaveReminder}
              style={reminderFormGrid}
            >
              <input
                type="text"
                placeholder="CRN"
                style={modalInput}
                value={newReminder.crn}
                onChange={event =>
                  setNewReminder({
                    ...newReminder,
                    crn:
                      event.target.value
                  })
                }
              />


              <input
                type="text"
                required
                placeholder="Course Code"
                style={modalInput}
                value={
                  newReminder.course_code
                }
                onChange={event =>
                  setNewReminder({
                    ...newReminder,
                    course_code:
                      event.target.value
                  })
                }
              />


              <input
                type="text"
                placeholder="Course Name"
                style={modalInput}
                value={
                  newReminder.course_name
                }
                onChange={event =>
                  setNewReminder({
                    ...newReminder,
                    course_name:
                      event.target.value
                  })
                }
              />


              <input
                type="text"
                placeholder="Section"
                style={modalInput}
                value={
                  newReminder.section
                }
                onChange={event =>
                  setNewReminder({
                    ...newReminder,
                    section:
                      event.target.value
                  })
                }
              />


              <input
                type="text"
                placeholder="Professor"
                style={modalInput}
                value={
                  newReminder.professor
                }
                onChange={event =>
                  setNewReminder({
                    ...newReminder,
                    professor:
                      event.target.value
                  })
                }
              />


              <div
                style={{
                  display: 'flex',
                  gap: '8px'
                }}
              >
                {editingReminderId && (
                  <button
                    type="button"
                    style={{
                      ...secondaryActionBtn,
                      flex: 1
                    }}
                    onClick={() => {
                      setEditingReminderId(
                        null
                      );

                      setNewReminder(
                        EMPTY_REMINDER
                      );
                    }}
                  >
                    Cancel
                  </button>
                )}


                <button
                  type="submit"
                  style={{
                    ...primaryActionBtn,
                    flex: 1,
                    justifyContent:
                      'center'
                  }}
                >
                  <Bell size={16} />

                  {editingReminderId
                    ? 'Update Alert'
                    : 'Add Alert'}
                </button>
              </div>
            </form>
          </div>


          <div>
            <h3 style={sectionHeading}>
              Your Seat Reminders
            </h3>


            {reminders.length === 0 ? (
              <div style={emptyCard}>
                You have no seat reminders.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '15px'
                }}
              >
                {reminders.map(reminder => (
                  <div
                    key={reminder.id}
                    style={swapCard}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px'
                        }}
                      >
                        <div
                          style={bellCircle}
                        >
                          <Bell size={18} />
                        </div>


                        <div>
                          <h4
                            style={{
                              margin: 0,
                              color:
                                '#0B1A3F',
                              fontWeight:
                                '900',
                              fontSize:
                                '17px'
                            }}
                          >
                            {
                              reminder.course_code
                            }
                          </h4>


                          {reminder.course_name && (
                            <p
                              style={{
                                margin:
                                  '2px 0 0',
                                color:
                                  '#475569',
                                fontWeight:
                                  '700',
                                fontSize:
                                  '12px'
                              }}
                            >
                              {
                                reminder.course_name
                              }
                            </p>
                          )}
                        </div>
                      </div>


                      <OwnerActions
                        onEdit={() =>
                          handleEditReminder(
                            reminder
                          )
                        }
                        onDelete={() =>
                          handleDeleteReminder(
                            reminder.id
                          )
                        }
                      />
                    </div>


                    <div
                      style={{
                        ...courseInfoGrid,
                        marginTop: '16px'
                      }}
                    >
                      <InfoItem
                        label="CRN"
                        value={reminder.crn}
                      />

                      <InfoItem
                        label="SECTION"
                        value={
                          reminder.section
                        }
                      />

                      <InfoItem
                        label="PROFESSOR"
                        value={
                          reminder.professor
                        }
                      />
                    </div>


                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: '10px'
                      }}
                    >
                      <span
                        style={
                          reminder.is_active
                            ? badgeGreen
                            : badgeGray
                        }
                      >
                        {reminder.is_active
                          ? 'MONITORING'
                          : 'PAUSED'}
                      </span>


                      <button
                        onClick={() =>
                          handleToggleReminder(
                            reminder
                          )
                        }
                        style={smallOutlineBtn}
                      >
                        {reminder.is_active
                          ? 'Pause Alert'
                          : 'Resume Alert'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          <div style={infoNotice}>
            <Bell
              size={18}
              color="#0B1A3F"
            />

            <div>
              <strong>
                Seat notification system
              </strong>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: '#64748B'
                }}
              >
                Your alert is saved in Campora.
                Automatic seat-opening detection requires
                connection to live university course
                availability data.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* ===================================================
          SWAP MODAL
      =================================================== */}

      {isMatchModalOpen && (
        <div style={overlay}>
          <div style={modalCardLarge}>
            <ModalHeader
              title={
                editingPostId
                  ? 'Edit Swap Request'
                  : 'Set Swap Preferences'
              }
              onClose={closeSwapModal}
            />


            {!matchResult ? (
              <form
                onSubmit={
                  handleFindOrPostMatch
                }
                style={modalForm}
              >

                {/* COURSE YOU HAVE */}

                <div style={swapFormSection}>
                  <div
                    style={
                      swapFormSectionHeader
                    }
                  >
                    <span style={badgeRed}>
                      HAVE
                    </span>

                    <div>
                      <h4
                        style={
                          swapFormTitle
                        }
                      >
                        Course You Have
                      </h4>

                      <p
                        style={
                          swapFormSubtitle
                        }
                      >
                        Enter your current
                        registered section.
                      </p>
                    </div>
                  </div>


                  <div style={twoColumnGrid}>
                    <div>
                      <label style={fieldLabel}>
                        COURSE CODE
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. CMPS 200"
                        style={modalInput}
                        value={
                          searchPref.haveCourse
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            haveCourse:
                              event.target.value
                          })
                        }
                      />
                    </div>


                    <div>
                      <label style={fieldLabel}>
                        CRN
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. 11312"
                        style={modalInput}
                        value={
                          searchPref.haveCrn
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            haveCrn:
                              event.target.value
                          })
                        }
                      />
                    </div>
                  </div>


                  <div>
                    <label style={fieldLabel}>
                      COURSE NAME
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Introduction to Programming"
                      style={modalInput}
                      value={
                        searchPref.haveCourseName
                      }
                      onChange={event =>
                        setSearchPref({
                          ...searchPref,
                          haveCourseName:
                            event.target.value
                        })
                      }
                    />
                  </div>


                  <div style={twoColumnGrid}>
                    <div>
                      <label style={fieldLabel}>
                        SECTION
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. 1"
                        style={modalInput}
                        value={
                          searchPref.haveSection
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            haveSection:
                              event.target.value
                          })
                        }
                      />
                    </div>


                    <div>
                      <label style={fieldLabel}>
                        PROFESSOR
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. Dr. Smith"
                        style={modalInput}
                        value={
                          searchPref.haveProf
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            haveProf:
                              event.target.value
                          })
                        }
                      />
                    </div>
                  </div>


                  <div style={twoColumnGrid}>
                    <div>
                      <label style={fieldLabel}>
                        DAYS
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. MWF"
                        style={modalInput}
                        value={
                          searchPref.haveDays
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            haveDays:
                              event.target.value
                          })
                        }
                      />
                    </div>


                    <div>
                      <label style={fieldLabel}>
                        TIME
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. 10:00 AM - 10:50 AM"
                        style={modalInput}
                        value={
                          searchPref.haveTime
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            haveTime:
                              event.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                </div>


                {/* COURSE YOU WANT */}

                <div style={swapFormSection}>
                  <div
                    style={
                      swapFormSectionHeader
                    }
                  >
                    <span style={badgeGreen}>
                      WANTS
                    </span>

                    <div>
                      <h4
                        style={
                          swapFormTitle
                        }
                      >
                        Course You Want
                      </h4>

                      <p
                        style={
                          swapFormSubtitle
                        }
                      >
                        Enter the exact
                        section you are
                        looking for.
                      </p>
                    </div>
                  </div>


                  <div style={twoColumnGrid}>
                    <div>
                      <label style={fieldLabel}>
                        COURSE CODE
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. CMPS 200"
                        style={modalInput}
                        value={
                          searchPref.wantCourse
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            wantCourse:
                              event.target.value
                          })
                        }
                      />
                    </div>


                    <div>
                      <label style={fieldLabel}>
                        CRN
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. 11842"
                        style={modalInput}
                        value={
                          searchPref.wantCrn
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            wantCrn:
                              event.target.value
                          })
                        }
                      />
                    </div>
                  </div>


                  <div>
                    <label style={fieldLabel}>
                      COURSE NAME
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Introduction to Programming"
                      style={modalInput}
                      value={
                        searchPref.wantCourseName
                      }
                      onChange={event =>
                        setSearchPref({
                          ...searchPref,
                          wantCourseName:
                            event.target.value
                        })
                      }
                    />
                  </div>


                  <div style={twoColumnGrid}>
                    <div>
                      <label style={fieldLabel}>
                        SECTION
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. 3"
                        style={modalInput}
                        value={
                          searchPref.wantSection
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            wantSection:
                              event.target.value
                          })
                        }
                      />
                    </div>


                    <div>
                      <label style={fieldLabel}>
                        PROFESSOR
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. Dr. Jones"
                        style={modalInput}
                        value={
                          searchPref.wantProf
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            wantProf:
                              event.target.value
                          })
                        }
                      />
                    </div>
                  </div>


                  <div style={twoColumnGrid}>
                    <div>
                      <label style={fieldLabel}>
                        DAYS
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. TR"
                        style={modalInput}
                        value={
                          searchPref.wantDays
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            wantDays:
                              event.target.value
                          })
                        }
                      />
                    </div>


                    <div>
                      <label style={fieldLabel}>
                        TIME
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. 12:30 PM - 1:45 PM"
                        style={modalInput}
                        value={
                          searchPref.wantTime
                        }
                        onChange={event =>
                          setSearchPref({
                            ...searchPref,
                            wantTime:
                              event.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                </div>


                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={
                      searchPref.isAnonymous
                    }
                    onChange={event =>
                      setSearchPref({
                        ...searchPref,
                        isAnonymous:
                          event.target.checked
                      })
                    }
                  />

                  Post anonymously
                </label>


                <button
                  type="submit"
                  style={primarySaveBtn}
                >
                  {editingPostId ? (
                    'Update Swap Request'
                  ) : (
                    <>
                      <Search size={16} />

                      Run Match Engine
                    </>
                  )}
                </button>
              </form>
            ) : matchResult.found ? (
              <div>
                <div style={successNotice}>
                  Perfect reciprocal match found!
                </div>


                <div
                  style={{
                    ...courseInfoGrid,
                    marginBottom: '18px'
                  }}
                >
                  <InfoItem
                    label="COURSE"
                    value={
                      matchResult.post
                        .have_course
                    }
                  />

                  <InfoItem
                    label="CRN"
                    value={
                      matchResult.post
                        .have_crn
                    }
                  />

                  <InfoItem
                    label="SECTION"
                    value={
                      matchResult.post
                        .have_section
                    }
                  />

                  <InfoItem
                    label="PROFESSOR"
                    value={
                      matchResult.post
                        .have_prof
                    }
                  />

                  <InfoItem
                    label="DAYS"
                    value={
                      matchResult.post
                        .have_days
                    }
                  />

                  <InfoItem
                    label="TIME"
                    value={
                      matchResult.post
                        .have_time
                    }
                  />
                </div>


                <p
                  style={{
                    ...bodyText,
                    textAlign: 'center',
                    marginBottom: '18px'
                  }}
                >
                  {matchResult.post.author_name}{' '}
                  has the course you want and
                  wants the course you have.
                </p>


                {canMessageUser(
                  matchResult.post.user_id,
                  matchResult.post
                    .is_anonymous,
                  matchResult.post.status
                ) ? (
                  <button
                    style={primarySaveBtn}
                    onClick={() => {
                      openDm(
                        matchResult.post
                          .user_id,
                        matchResult.post
                          .author_name,
                        matchResult.post
                          .is_anonymous,
                        matchResult.post
                          .status
                      );

                      closeSwapModal();
                    }}
                  >
                    <MessageCircle
                      size={16}
                    />

                    Message Student
                  </button>
                ) : (
                  <div style={infoNotice}>
                    This student cannot currently
                    be contacted for this swap.
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center'
                }}
              >
                <div style={warningNotice}>
                  No immediate reciprocal match found.
                </div>


                <p
                  style={{
                    ...bodyText,
                    marginBottom: '18px'
                  }}
                >
                  Post your request so other students can
                  find it.
                </p>


                <button
                  onClick={
                    handleConfirmPostMatch
                  }
                  style={primarySaveBtn}
                >
                  Post Request to Board
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ===================================================
          REVIEW MODAL
      =================================================== */}

      {isReviewModalOpen && (
        <div style={overlay}>
          <div style={modalCardLarge}>
            <ModalHeader
              title={
                editingReviewId
                  ? 'Edit Course Review'
                  : 'Write Course Review'
              }
              onClose={closeReviewModal}
            />


            <form
              onSubmit={handleSaveReview}
              style={modalForm}
            >
              <div style={twoColumnGrid}>
                <div>
                  <label style={fieldLabel}>
                    CRN
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. 12345"
                    style={modalInput}
                    value={newReview.crn}
                    onChange={event =>
                      setNewReview({
                        ...newReview,
                        crn:
                          event.target.value
                      })
                    }
                  />
                </div>


                <div>
                  <label style={fieldLabel}>
                    COURSE CODE
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. CMPS 200"
                    style={modalInput}
                    value={
                      newReview.course_code
                    }
                    onChange={event =>
                      setNewReview({
                        ...newReview,
                        course_code:
                          event.target.value
                      })
                    }
                  />
                </div>
              </div>


              <div>
                <label style={fieldLabel}>
                  COURSE NAME
                </label>

                <input
                  type="text"
                  required
                  placeholder="Course name"
                  style={modalInput}
                  value={
                    newReview.course_name
                  }
                  onChange={event =>
                    setNewReview({
                      ...newReview,
                      course_name:
                        event.target.value
                    })
                  }
                />
              </div>


              <div style={twoColumnGrid}>
                <div>
                  <label style={fieldLabel}>
                    SECTION
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Section"
                    style={modalInput}
                    value={
                      newReview.section
                    }
                    onChange={event =>
                      setNewReview({
                        ...newReview,
                        section:
                          event.target.value
                      })
                    }
                  />
                </div>


                <div>
                  <label style={fieldLabel}>
                    PROFESSOR
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Professor name"
                    style={modalInput}
                    value={
                      newReview.professor_name
                    }
                    onChange={event =>
                      setNewReview({
                        ...newReview,
                        professor_name:
                          event.target.value
                      })
                    }
                  />
                </div>
              </div>


              <div style={twoColumnGrid}>
                <div>
                  <label style={fieldLabel}>
                    DAYS
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. MWF"
                    style={modalInput}
                    value={
                      newReview.meeting_days
                    }
                    onChange={event =>
                      setNewReview({
                        ...newReview,
                        meeting_days:
                          event.target.value
                      })
                    }
                  />
                </div>


                <div>
                  <label style={fieldLabel}>
                    TIME
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. 10:00 - 10:50"
                    style={modalInput}
                    value={
                      newReview.meeting_time
                    }
                    onChange={event =>
                      setNewReview({
                        ...newReview,
                        meeting_time:
                          event.target.value
                      })
                    }
                  />
                </div>
              </div>


              <div>
                <label style={fieldLabel}>
                  SEMESTER
                </label>

                <input
                  type="text"
                  placeholder="e.g. Fall 2026"
                  style={modalInput}
                  value={
                    newReview.semester
                  }
                  onChange={event =>
                    setNewReview({
                      ...newReview,
                      semester:
                        event.target.value
                    })
                  }
                />
              </div>


              <div style={twoColumnGrid}>
                <div>
                  <label style={fieldLabel}>
                    RATING
                  </label>

                  <select
                    style={modalInput}
                    value={newReview.rating}
                    onChange={event =>
                      setNewReview({
                        ...newReview,
                        rating:
                          Number(
                            event.target.value
                          )
                      })
                    }
                  >
                    {[5, 4, 3, 2, 1].map(
                      number => (
                        <option
                          key={number}
                          value={number}
                        >
                          {number}/5
                        </option>
                      )
                    )}
                  </select>
                </div>


                <div>
                  <label style={fieldLabel}>
                    DIFFICULTY
                  </label>

                  <select
                    style={modalInput}
                    value={
                      newReview.difficulty
                    }
                    onChange={event =>
                      setNewReview({
                        ...newReview,
                        difficulty:
                          Number(
                            event.target.value
                          )
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5].map(
                      number => (
                        <option
                          key={number}
                          value={number}
                        >
                          {number}/5
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>


              <div>
                <label style={fieldLabel}>
                  YOUR FEEDBACK
                </label>

                <textarea
                  required
                  placeholder="Tell students about the course, professor, workload, exams, assignments, attendance, or anything useful."
                  style={{
                    ...modalInput,
                    height: '120px',
                    resize: 'vertical'
                  }}
                  value={newReview.comment}
                  onChange={event =>
                    setNewReview({
                      ...newReview,
                      comment:
                        event.target.value
                    })
                  }
                />
              </div>


              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={
                    newReview.is_anonymous
                  }
                  onChange={event =>
                    setNewReview({
                      ...newReview,
                      is_anonymous:
                        event.target.checked
                    })
                  }
                />

                Post anonymously
              </label>


              <button
                type="submit"
                style={primarySaveBtn}
              >
                {editingReviewId
                  ? 'Save Review Changes'
                  : 'Post Review'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ===================================================
          DIRECT MESSAGE MODAL
      =================================================== */}

      {activeDmUser && (
        <div style={overlay}>
          <div style={chatModal}>
            <ModalHeader
              title={`Chat with ${activeDmUser.name}`}
              onClose={() => {
                setActiveDmUser(null);
                setDmMessage('');
                setDmMessages([]);
              }}
            />


            <div style={chatHistory}>
              {dmLoading ? (
                <div style={loadingBox}>
                  Loading conversation...
                </div>
              ) : dmMessages.length === 0 ? (
                <div style={emptyChat}>
                  No messages yet. Start the
                  conversation.
                </div>
              ) : (
                dmMessages.map(message => {
                  const mine =
                    message.sender_id ===
                    currentUserId;


                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent:
                          mine
                            ? 'flex-end'
                            : 'flex-start',
                        marginBottom:
                          '10px'
                      }}
                    >
                      <div
                        style={{
                          ...messageBubble,
                          background: mine
                            ? '#0B1A3F'
                            : '#F1F5F9',
                          color: mine
                            ? '#FFFFFF'
                            : '#0B1A3F'
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize:
                              '13px',
                            lineHeight:
                              1.45,
                            fontWeight:
                              '600'
                          }}
                        >
                          {
                            message.message
                          }
                        </p>


                        <div
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'space-between',
                            gap: '10px',
                            marginTop:
                              '5px'
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                '9px',
                              opacity: 0.7
                            }}
                          >
                            {new Date(
                              message.created_at
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  '2-digit',
                                minute:
                                  '2-digit'
                              }
                            )}
                          </span>


                          {mine && (
                            <button
                              onClick={() =>
                                handleDeleteMessage(
                                  message
                                )
                              }
                              style={messageDeleteBtn}
                              title="Delete message"
                            >
                              <Trash2
                                size={11}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>


            <div style={chatComposer}>
              <textarea
                placeholder="Write a message..."
                value={dmMessage}
                onChange={event =>
                  setDmMessage(
                    event.target.value
                  )
                }
                onKeyDown={event => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    handleSendDirectMessage();
                  }
                }}
                style={{
                  ...modalInput,
                  height: '70px',
                  resize: 'none'
                }}
              />


              <button
                onClick={
                  handleSendDirectMessage
                }
                style={{
                  ...primarySaveBtn,
                  width: 'auto',
                  padding:
                    '13px 18px'
                }}
              >
                <Send size={16} />

                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// =========================================================
// SMALL COMPONENTS
// =========================================================

function StudentIdentity({
  name,
  isAnonymous,
  clickable,
  onClick
}) {
  const displayName =
    name || 'Student';


  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor:
          clickable
            ? 'pointer'
            : 'default'
      }}
    >
      <div style={avatarCircle}>
        {displayName
          .charAt(0)
          .toUpperCase()}
      </div>


      <div>
        <p
          style={{
            margin: 0,
            fontWeight: '900',
            color: '#0B1A3F',
            fontSize: '14px'
          }}
        >
          {displayName}
        </p>


        <span
          style={{
            fontSize: '10px',
            color: '#A3AED0',
            fontWeight: '700'
          }}
        >
          {isAnonymous
            ? 'Anonymous'
            : clickable
              ? 'Click to message'
              : 'Student'}
        </span>
      </div>
    </div>
  );
}


function OwnerActions({
  onEdit,
  onDelete
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px'
      }}
    >
      <button
        onClick={onEdit}
        style={iconActionBtn}
        title="Edit"
      >
        <Edit3 size={14} />
      </button>


      <button
        onClick={onDelete}
        style={{
          ...iconActionBtn,
          color: '#EF4444'
        }}
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}


function InfoItem({
  label,
  value
}) {
  return (
    <div>
      <span style={infoLabel}>
        {label}
      </span>

      <p style={infoValue}>
        {value || '—'}
      </p>
    </div>
  );
}


function ModalHeader({
  title,
  onClose
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}
    >
      <h2
        style={{
          margin: 0,
          color: '#0B1A3F',
          fontWeight: '900',
          fontSize: '20px'
        }}
      >
        {title}
      </h2>


      <button
        type="button"
        onClick={onClose}
        style={closeModalBtn}
      >
        <X size={19} />
      </button>
    </div>
  );
}


function ReplyComposer({
  value,
  onChange,
  placeholder,
  onSubmit,
  onCancel
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        style={{
          ...modalInput,
          flex: 1
        }}
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();

            onSubmit();
          }
        }}
      />


      <button
        type="button"
        onClick={onSubmit}
        style={primaryActionBtn}
      >
        Reply
      </button>


      <button
        type="button"
        onClick={onCancel}
        style={{
          ...iconActionBtn,
          height: '42px',
          width: '42px'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}


function ReplyCard({
  reply,
  currentUserId,
  editing,
  editingText,
  onEditingTextChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onMessage
}) {
  const mine =
    reply.user_id === currentUserId;


  return (
    <div style={replyCard}>
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          gap: '8px',
          alignItems:
            'flex-start'
        }}
      >
        <div
          onClick={
            !mine
              ? onMessage
              : undefined
          }
          style={{
            cursor:
              !mine
                ? 'pointer'
                : 'default'
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: '900',
              fontSize: '12px',
              color: '#0B1A3F'
            }}
          >
            {reply.author_name}
          </p>


          <span
            style={{
              fontSize: '9px',
              color: '#A3AED0',
              fontWeight: '700'
            }}
          >
            {!mine
              ? 'Click to message'
              : 'Your reply'}
          </span>
        </div>


        {mine && !editing && (
          <OwnerActions
            onEdit={onStartEdit}
            onDelete={onDelete}
          />
        )}
      </div>


      {editing ? (
        <div
          style={{
            marginTop: '8px'
          }}
        >
          <textarea
            style={{
              ...modalInput,
              minHeight: '70px',
              resize: 'vertical'
            }}
            value={editingText}
            onChange={event =>
              onEditingTextChange(
                event.target.value
              )
            }
          />


          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px'
            }}
          >
            <button
              type="button"
              style={primaryActionBtn}
              onClick={onSaveEdit}
            >
              Save
            </button>


            <button
              type="button"
              style={secondaryActionBtn}
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '12px',
            color: '#475569',
            fontWeight: '600',
            lineHeight: 1.5
          }}
        >
          {reply.content}
        </p>
      )}
    </div>
  );
}


// =========================================================
// STYLES
// =========================================================

const activeTabBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#0B1A3F',
  color: 'white',
  border: 'none',
  padding: '12px 18px',
  borderRadius: '14px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};


const inactiveTabBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#FFFFFF',
  color: '#64748B',
  border:
    '1.5px solid #E2E8F0',
  padding: '12px 18px',
  borderRadius: '14px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};


const matchSearchBtn = {
  background: '#FFFFFF',
  color: '#0B1A3F',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '14px',
  fontWeight: '900',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};


const primaryActionBtn = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '12px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px'
};


const secondaryActionBtn = {
  background: '#FFFFFF',
  color: '#0B1A3F',
  border:
    '1.5px solid #E2E8F0',
  padding: '10px 16px',
  borderRadius: '12px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer'
};


const primarySaveBtn = {
  width: '100%',
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '900',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
};


const sectionHeading = {
  margin: '0 0 15px',
  fontSize: '20px',
  fontWeight: '900',
  color: '#0B1A3F'
};


const sectionDescription = {
  margin: '0 0 18px',
  fontSize: '13px',
  color: '#64748B',
  fontWeight: '600',
  lineHeight: 1.5
};


const sectionTopRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '15px',
  flexWrap: 'wrap'
};


const swapCard = {
  background: '#FFFFFF',
  padding: '20px',
  borderRadius: '20px',
  border:
    '1.5px solid #E2E8F0',
  boxShadow:
    '0 4px 12px rgba(0,0,0,0.03)',
  transition:
    'all 0.2s ease'
};


const takenSwapCard = {
  background: '#FBFCFE',
  border:
    '1.5px solid #CBD5E1'
};


const reviewCard = {
  background: '#FFFFFF',
  padding: '22px',
  borderRadius: '20px',
  border:
    '1.5px solid #E2E8F0',
  boxShadow:
    '0 4px 12px rgba(0,0,0,0.03)'
};


const emptyCard = {
  background: '#FFFFFF',
  border:
    '1.5px dashed #CBD5E1',
  padding: '30px',
  borderRadius: '20px',
  textAlign: 'center',
  color: '#94A3B8',
  fontWeight: '700',
  fontSize: '14px'
};


const loadingBox = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '35px',
  color: '#A3AED0',
  fontWeight: '700'
};


const avatarCircle = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  background: '#F8FAFC',
  border:
    '1.5px solid #E2E8F0',
  color: '#0B1A3F',
  fontWeight: '900',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  flexShrink: 0
};


const swapCourseBlock = {
  background: '#F8FAFC',
  border: '1px solid #E9EDF5',
  borderRadius: '15px',
  padding: '15px'
};


const swapCourseHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px'
};


const swapCourseName = {
  margin: '0 0 12px',
  color: '#64748B',
  fontSize: '11px',
  fontWeight: '700',
  lineHeight: 1.4
};


const compactCourseInfoGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '10px',
  paddingTop: '11px',
  borderTop:
    '1px solid #E2E8F0'
};


const swapArrowDivider = {
  position: 'relative',
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};


const swapArrowCircle = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: '#FFFFFF',
  border: '1.5px solid #E2E8F0',
  color: '#94A3B8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};


const smallCrnBadge = {
  background: '#FFFFFF',
  color: '#64748B',
  border:
    '1px solid #E2E8F0',
  padding: '4px 8px',
  borderRadius: '8px',
  fontSize: '9px',
  fontWeight: '900'
};


const availableStatusBadge = {
  background: '#DCFCE7',
  color: '#15803D',
  border:
    '1px solid #BBF7D0',
  padding: '5px 9px',
  borderRadius: '9px',
  fontSize: '9px',
  fontWeight: '900',
  letterSpacing: '0.4px'
};


const takenStatusBadge = {
  background: '#F1F5F9',
  color: '#64748B',
  border:
    '1px solid #CBD5E1',
  padding: '5px 9px',
  borderRadius: '9px',
  fontSize: '9px',
  fontWeight: '900',
  letterSpacing: '0.4px'
};


const takenNotice = {
  marginTop: '15px',
  background: '#F1F5F9',
  color: '#64748B',
  border:
    '1px solid #E2E8F0',
  padding: '10px 12px',
  borderRadius: '11px',
  fontSize: '11px',
  fontWeight: '800',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px'
};


const markTakenButton = {
  width: '100%',
  background: '#FFFFFF',
  color: '#0B1A3F',
  border:
    '1.5px solid #CBD5E1',
  padding: '9px 12px',
  borderRadius: '11px',
  fontWeight: '800',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  marginTop: '10px'
};


const reopenSwapButton = {
  ...markTakenButton,
  color: '#475569'
};


const swapFormSection = {
  background: '#F8FAFC',
  border:
    '1px solid #E2E8F0',
  borderRadius: '16px',
  padding: '17px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};


const swapFormSectionHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '2px'
};


const swapFormTitle = {
  margin: 0,
  color: '#0B1A3F',
  fontSize: '14px',
  fontWeight: '900'
};


const swapFormSubtitle = {
  margin: '2px 0 0',
  color: '#94A3B8',
  fontSize: '10px',
  fontWeight: '700'
};


const badgeRed = {
  background: '#FEE2E2',
  color: '#DC2626',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '10px',
  fontWeight: '900'
};


const badgeGreen = {
  background: '#DCFCE7',
  color: '#16A34A',
  padding: '4px 9px',
  borderRadius: '7px',
  fontSize: '10px',
  fontWeight: '900'
};


const badgeGray = {
  background: '#F1F5F9',
  color: '#64748B',
  padding: '4px 9px',
  borderRadius: '7px',
  fontSize: '10px',
  fontWeight: '900'
};


const reviewTag = {
  background: '#FEF3C7',
  color: '#D97706',
  padding: '5px 10px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: '800'
};


const dmBtnStyle = {
  width: '100%',
  background: '#FFFFFF',
  border:
    '1.5px solid #E2E8F0',
  color: '#0B1A3F',
  padding: '10px',
  borderRadius: '12px',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px'
};


const modalInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: '12px',
  border:
    '1.5px solid #E2E8F0',
  fontSize: '13px',
  fontWeight: '700',
  color: '#0B1A3F',
  outline: 'none',
  background: '#FFFFFF'
};


const selectInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: '12px',
  border:
    '1.5px solid #E2E8F0',
  fontSize: '14px',
  fontWeight: '800',
  color: '#0B1A3F',
  outline: 'none',
  background: '#FFFFFF'
};


const fieldLabel = {
  fontSize: '10px',
  fontWeight: '900',
  color: '#0B1A3F',
  marginBottom: '6px',
  display: 'block',
  letterSpacing: '0.6px'
};


const checkboxLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '700',
  color: '#0B1A3F'
};


const overlay = {
  position: 'fixed',
  inset: 0,
  background:
    'rgba(11,26,63,0.42)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  zIndex: 1000
};


const modalCardLarge = {
  width: '100%',
  maxWidth: '650px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '28px',
  boxSizing: 'border-box',
  background: '#FFFFFF',
  borderRadius: '24px',
  boxShadow:
    '0 20px 50px rgba(0,0,0,0.18)'
};


const chatModal = {
  width: '100%',
  maxWidth: '500px',
  maxHeight: '85vh',
  padding: '24px',
  boxSizing: 'border-box',
  background: '#FFFFFF',
  borderRadius: '22px',
  boxShadow:
    '0 20px 50px rgba(0,0,0,0.20)'
};


const modalForm = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
};


const twoColumnGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '10px'
};


const formBottomRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '15px',
  flexWrap: 'wrap'
};


const iconActionBtn = {
  background: '#FFFFFF',
  border:
    '1.5px solid #E2E8F0',
  padding: '7px',
  borderRadius: '8px',
  cursor: 'pointer',
  color: '#64748B',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};


const closeModalBtn = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px'
};


const courseInfoGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '12px',
  padding: '15px',
  margin: '15px 0',
  background: '#F8FAFC',
  borderRadius: '14px',
  border:
    '1px solid #E2E8F0'
};


const infoLabel = {
  display: 'block',
  color: '#94A3B8',
  fontSize: '9px',
  fontWeight: '900',
  letterSpacing: '0.6px',
  marginBottom: '3px'
};


const infoValue = {
  margin: 0,
  color: '#0B1A3F',
  fontSize: '12px',
  fontWeight: '800'
};


const bodyText = {
  margin: 0,
  fontSize: '13px',
  color: '#334155',
  fontWeight: '600',
  lineHeight: 1.6
};


const replySection = {
  display: 'flex',
  flexDirection: 'column',
  gap: '9px',
  marginTop: '15px',
  paddingLeft: '14px',
  borderLeft:
    '2px solid #E2E8F0'
};


const replyCard = {
  background: '#F8FAFC',
  padding: '11px 13px',
  borderRadius: '12px',
  border:
    '1px solid #E2E8F0'
};


const replyButton = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#0B1A3F',
  fontWeight: '800',
  fontSize: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};


const reminderFormGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '10px'
};


const bellCircle = {
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  background: '#F8FAFC',
  color: '#0B1A3F',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border:
    '1px solid #E2E8F0'
};


const smallOutlineBtn = {
  background: '#FFFFFF',
  border:
    '1px solid #E2E8F0',
  borderRadius: '9px',
  color: '#0B1A3F',
  padding: '7px 10px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: '800'
};


const infoNotice = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '15px',
  background: '#F8FAFC',
  border:
    '1px solid #E2E8F0',
  borderRadius: '14px',
  color: '#0B1A3F',
  fontSize: '12px',
  fontWeight: '600'
};


const successNotice = {
  background: '#DCFCE7',
  color: '#15803D',
  padding: '15px',
  borderRadius: '15px',
  marginBottom: '18px',
  fontWeight: '900'
};


const warningNotice = {
  background: '#FEF3C7',
  color: '#B45309',
  padding: '15px',
  borderRadius: '15px',
  marginBottom: '18px',
  fontWeight: '900'
};


const chatHistory = {
  height: '340px',
  overflowY: 'auto',
  padding: '12px',
  background: '#F8FAFC',
  borderRadius: '14px',
  border:
    '1px solid #E2E8F0',
  marginBottom: '12px'
};


const emptyChat = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: '#94A3B8',
  fontSize: '13px',
  fontWeight: '700'
};


const messageBubble = {
  maxWidth: '75%',
  padding: '10px 12px',
  borderRadius: '14px'
};


const messageDeleteBtn = {
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  opacity: 0.75,
  cursor: 'pointer',
  display: 'flex',
  padding: 0
};


const chatComposer = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '8px'
};