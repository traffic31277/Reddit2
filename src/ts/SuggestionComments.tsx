import { useState } from 'react';
import {
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { getCurrentUser } from 'aws-amplify/auth';
import profanity from 'allprofanity';
import '../css/SuggestionComments.css';
import { describeDatabaseError, getDocumentClient } from './dynamoSession';

interface CommentItem {
    suggestionId: string;
    commentId: string;
    userId: string;
    pseudonym: string;
    text: string;
    createdAt: string;
}

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

    async function loadComments() {
        setLoading(true);
        setError('');

        try {
            const docClient = await getDocumentClient();
            const loadedComments: CommentItem[] = [];
            let lastEvaluatedKey: Record<string, unknown> | undefined;

            do {
                const response = await docClient.send(
                    new QueryCommand({
                        TableName: 'Comments',
                        KeyConditionExpression: 'suggestionId = :suggestionId',
                        ExpressionAttributeValues: {
                            ':suggestionId': suggestionId,
                        },
                        ScanIndexForward: true,
                        ExclusiveStartKey: lastEvaluatedKey,
                    })
                );

                if (response.Items) {
                    loadedComments.push(...(response.Items as CommentItem[]));
                }

                lastEvaluatedKey = response.LastEvaluatedKey;
            } while (lastEvaluatedKey);

            setComments(loadedComments);

            // The table is the source of truth for the expanded comment count.
            setCommentCount(loadedComments.length);
        }
        catch (err) {
            console.error('Error loading comments:', err);
            setError(describeDatabaseError(err, 'Comments'));
        }
        finally {
            setLoading(false);
        }
    }

    async function toggleComments() {
        const openingComments = !expanded;
        setExpanded(openingComments);

        if (openingComments) {
            await loadComments();
        }
    }

    async function postComment() {
        const cleanedText = text.trim();

        if (cleanedText.length === 0) {
            setError('Enter a comment before posting.');
            return;
        }

        if (cleanedText.length > 1000) {
            setError('Comments must be 1000 characters or less.');
            return;
        }

        if (profanity.check(cleanedText)) {
            setError('No profanity allowed :)');
            return;
        }

        setPosting(true);
        setError('');

        try {
            const { userId } = await getCurrentUser();
            const docClient = await getDocumentClient();

            // Read the user's pseudonym so comments stay anonymous like suggestions.
            const user = await docClient.send(
                new GetCommand({
                    TableName: 'Users',
                    Key: {
                        userId: userId,
                    },
                })
            );

            const createdAt = new Date().toISOString();
            const commentId = `COMMENT_${createdAt}`;
            const pseudonym = String(user.Item?.pseudonym ?? 'Anonymous');

            const newComment: CommentItem = {
                suggestionId: suggestionId,
                commentId: commentId,
                userId: userId,
                pseudonym: pseudonym,
                text: cleanedText,
                createdAt: createdAt,
            };

            // suggestionId is the partition key and commentId is the sort key.
            await docClient.send(
                new PutCommand({
                    TableName: 'Comments',
                    Item: {
                        ...newComment,
                        suggestionUserId: suggestionUserId,
                    },
                    ConditionExpression: 'attribute_not_exists(commentId)',
                })
            );

            // Keep the parent suggestion's stored comment count up to date.
            try {
                await docClient.send(
                    new UpdateCommand({
                        TableName: 'Suggestions',
                        Key: {
                            userId: suggestionUserId,
                            suggestionId: suggestionId,
                        },
                        UpdateExpression: 'ADD #comments :one',
                        ExpressionAttributeNames: {
                            '#comments': 'comments',
                        },
                        ExpressionAttributeValues: {
                            ':one': 1,
                        },
                    })
                );
            }
            catch (countError) {
                console.error('Comment saved, but comment count could not be updated:', countError);
            }

            setComments((currentComments) => [...currentComments, newComment]);
            setCommentCount((currentCount) => currentCount + 1);
            setText('');
        }
        catch (err) {
            console.error('Error posting comment:', err);
            setError(describeDatabaseError(err, 'Comments'));
        }
        finally {
            setPosting(false);
        }
    }

    return (
        <div className='suggestion_comments'>
            <button
                className='comments_background'
                type='button'
                onClick={toggleComments}
            >
                <b>comments ({commentCount})</b>
            </button>

            {expanded && (
                <div className='comments_panel'>
                    {loading && <p className='comments_status'>Loading comments...</p>}

                    {!loading && !error && comments.length === 0 && (
                        <p className='comments_status'>No comments yet.</p>
                    )}

                    {!loading && comments.map((comment) => (
                        <div className='comment_background' key={comment.commentId}>
                            <h3 className='comment_username'>{comment.pseudonym}</h3>
                            <p className='comment_content'>{comment.text}</p>
                        </div>
                    ))}

                    <div className='comment_form'>
                        <textarea
                            className='comment_input'
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            placeholder='Write a comment...'
                            maxLength={1000}
                        />

                        <button
                            className='comment_button'
                            type='button'
                            onClick={postComment}
                            disabled={posting}
                        >
                            {posting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>

                    {error && (
                        <div className='comment_error' role='alert'>
                            <p>{error}</p>
                            <button className='comment_retry' type='button'
                                onClick={() => void loadComments()} disabled={loading}>
                                Retry loading comments
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SuggestionComments;
