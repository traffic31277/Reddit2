/*
* Code Reviewed By Blair 11/16/2026.
*/

import { useRef, useState } from 'react';
import profanity from 'allprofanity';
import '../css/SuggestionComments.css';
import { describeDatabaseError, getSignedInDynamo } from './dynamoSession';
import { createSuggestionStore, type CommentItem } from './suggestionStore';

interface SuggestionCommentsProps {
    suggestionId: string;
    suggestionUserId: string;
    initialCommentCount: number;
}

function SuggestionComments({
    suggestionId,
    suggestionUserId,
    initialCommentCount,
}: SuggestionCommentsProps) {
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [commentCount, setCommentCount] = useState(initialCommentCount);
    const [text, setText] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const postingComment = useRef(false);
    const loadNumber = useRef(0);
    const pendingComment = useRef<{ commentId: string; text: string } | null>(null);
    const key = { userId: suggestionUserId, suggestionId };

    // Loads comments from the database and updates the state
    async function loadComments() {
        if (postingComment.current) {
            return;
        }
        const thisLoad = ++loadNumber.current;
        setLoading(true);
        setError('');

        try {
            const { client } = await getSignedInDynamo();
            const store = createSuggestionStore(client);
            const loadedComments = await store.listComments(key);
            if (thisLoad === loadNumber.current) {
                setComments(loadedComments);
                setCommentCount(loadedComments.length);
            }
        } catch (error) {  
            console.error('Could not load comments:', error); 
            if (thisLoad === loadNumber.current) {
                setError(describeDatabaseError(error, 'Comments'));
            }
        } finally { 
            if (thisLoad === loadNumber.current) {
                setLoading(false);
            }
        }
    }

    // Toggles the expanded state of the comments section
    function toggleComments() {
        setExpanded(!expanded);
        if (!expanded) {
            void loadComments();
        }
    }

    // Handles the submission of a new comment, including validation and saving to the database
    async function postComment() {
        if (postingComment.current || loading) {
            return;
        }
        const cleanedText = text.trim(); // Trim whitespace from the comment text
        if (!cleanedText || cleanedText.length > 1000) {
            setError('Enter a comment with 1 to 1000 characters.');
            return;
        }
        if (profanity.check(cleanedText)) { // Check for profanity in the comment text
            setError('No profanity allowed :)');
            return;
        }

        if (pendingComment.current?.text !== cleanedText) { // If the pending comment is different from the current text, create a new pending comment
            pendingComment.current = {
                commentId: 'COMMENT_' + new Date().toISOString(),
                text: cleanedText,
            };
        }

        postingComment.current = true;
        setPosting(true);
        setError('');
        try { 
            const { userId, client } = await getSignedInDynamo();
            const store = createSuggestionStore(client);
            const comment = await store.saveComment(
                key,
                userId,
                pendingComment.current.commentId,
                cleanedText,
            );
            setComments((current) => { // Update the comments state with the new comment, ensuring no duplicates and sorting by commentId
                const otherComments = current.filter(
                    (item) => item.commentId !== comment.commentId,
                );
                return [...otherComments, comment].sort((a, b) =>
                    a.commentId.localeCompare(b.commentId),
                );
            });
            setCommentCount((count) => // Increment the comment count only if the comment is new
                comments.some((item) => item.commentId === comment.commentId) ? count : count + 1,
            );
            setText('');
            pendingComment.current = null;
        } catch (error) { // Handle errors during comment posting, including specific handling for comment ID conflicts
            console.error('Could not save comment:', error);
            if ((error as Error).name === 'CommentIdConflict') {
                pendingComment.current = null;
                setError((error as Error).message);
            } else {
                setError(describeDatabaseError(error, 'Comments'));
            }
        } finally { // Reset the posting state and allow new comments to be posted
            postingComment.current = false;
            setPosting(false);
        }
    }

    return (
        <div className='suggestion_comments'>
            <button
                className='comments_background'
                type='button'
                onClick={toggleComments}
                aria-expanded={expanded}
                disabled={posting}
            >
                <b>comments ({commentCount})</b>
            </button>

            {expanded && (
                <div className='comments_panel'>
                    {loading && (
                        <p className='comments_status' role='status'>
                            Loading comments...
                        </p>
                    )}
                    {!loading && !error && comments.length === 0 && (
                        <p className='comments_status'>No comments yet.</p>
                    )}
                    {comments.map((comment) => (
                        <div className='comment_background' key={comment.commentId}>
                            <h3 className='comment_username'>{comment.pseudonym}</h3>
                            <p className='comment_content'>{comment.text}</p>
                        </div>
                    ))}

                    {error && (
                        <p className='comment_error' role='alert'>
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default SuggestionComments;
