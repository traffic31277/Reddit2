import { useEffect, useRef, useState } from 'react';
import {
    GetCommand,
    TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { getCurrentUser } from 'aws-amplify/auth';
import '../css/SuggestionVotes.css';
import { describeDatabaseError, getDocumentClient } from './dynamoSession';

type Vote = 'like' | 'dislike' | 'none';

type SavedVote = {
    suggestionId: string;
    userId: string;
    vote: 'like' | 'dislike';
};

interface SuggestionVotesProps {
    suggestionId: string;
    suggestionUserId: string;
    likes: number;
    dislikes: number;
    onCountsChange: (likes: number, dislikes: number) => void;
}

function getVoteChange(previous: Vote, next: Vote) {
    return {
        likes: Number(next === 'like') - Number(previous === 'like'),
        dislikes: Number(next === 'dislike') - Number(previous === 'dislike'),
    };
}

export default function SuggestionVotes({
    suggestionId,
    suggestionUserId,
    likes,
    dislikes,
    onCountsChange,
}: SuggestionVotesProps) {
    const [viewerId, setViewerId] = useState('');
    const [viewerVote, setViewerVote] = useState<Vote>('none');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const savingVote = useRef(false);

    const ownSuggestion = viewerId !== '' && viewerId === suggestionUserId;

    // Restore this user's vote whenever the suggestion changes or the page reloads.
    useEffect(() => {
        let active = true;

        async function loadVote() {
            setLoading(true);
            setError('');

            try {
                const { userId } = await getCurrentUser();
                const docClient = await getDocumentClient();
                const response = await docClient.send(
                    new GetCommand({
                        TableName: 'SuggestionVotes',
                        Key: { suggestionId, userId },
                        ConsistentRead: true,
                    })
                );

                if (active) {
                    setViewerId(userId);
                    setViewerVote(response.Item?.vote === 'like' || response.Item?.vote === 'dislike'
                        ? response.Item.vote
                        : 'none');
                }
            } catch (err) {
                console.error('Could not load your vote:', err);
                if (active) {
                    setError(describeDatabaseError(err, 'SuggestionVotes'));
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadVote();
        return () => { active = false; };
    }, [suggestionId, suggestionUserId]);

    async function handleVote(clickedVote: 'like' | 'dislike') {
        if (savingVote.current || loading || !viewerId || ownSuggestion) {
            return;
        }

        savingVote.current = true;
        setSaving(true);
        setError('');

        try {
            const docClient = await getDocumentClient();
            const voteKey = { suggestionId, userId: viewerId };

            // Recheck the saved choice so a second tab cannot silently overwrite it.
            const previousResponse = await docClient.send(
                new GetCommand({
                    TableName: 'SuggestionVotes',
                    Key: voteKey,
                    ConsistentRead: true,
                })
            );
            const savedVote = previousResponse.Item as SavedVote | undefined;
            const previousVote: Vote = savedVote?.vote === 'like' || savedVote?.vote === 'dislike'
                ? savedVote.vote
                : 'none';
            const nextVote: Vote = previousVote === clickedVote ? 'none' : clickedVote;
            const change = getVoteChange(previousVote, nextVote);

            // Put, Update, or Delete the one vote belonging to this user.
            // Conditional writes prevent two tabs from both applying the same count change.
            const voteWrite = nextVote === 'none'
                ? {
                    Delete: {
                        TableName: 'SuggestionVotes',
                        Key: voteKey,
                        ConditionExpression: '#vote = :previous',
                        ExpressionAttributeNames: { '#vote': 'vote' },
                        ExpressionAttributeValues: { ':previous': previousVote },
                    },
                }
                : previousVote === 'none'
                    ? {
                        Put: {
                            TableName: 'SuggestionVotes',
                            Item: {
                                ...voteKey,
                                vote: nextVote,
                                suggestionUserId,
                                createdAt: new Date().toISOString(),
                            },
                            ConditionExpression: 'attribute_not_exists(suggestionId)',
                        },
                    }
                    : {
                        Update: {
                            TableName: 'SuggestionVotes',
                            Key: voteKey,
                            UpdateExpression: 'SET #vote = :next',
                            ConditionExpression: '#vote = :previous',
                            ExpressionAttributeNames: { '#vote': 'vote' },
                            ExpressionAttributeValues: {
                                ':next': nextVote,
                                ':previous': previousVote,
                            },
                        },
                    };

            let countCondition = 'attribute_exists(#suggestionId)';
            const countValues: Record<string, number> = {
                ':likesChange': change.likes,
                ':dislikesChange': change.dislikes,
            };

            // Do not allow a stored count to become negative.
            if (change.likes < 0) {
                countCondition += ' AND #likes >= :one';
                countValues[':one'] = 1;
            }
            if (change.dislikes < 0) {
                countCondition += ' AND #dislikes >= :one';
                countValues[':one'] = 1;
            }

            // Both table changes succeed or fail together.
            await docClient.send(
                new TransactWriteCommand({
                    TransactItems: [
                        voteWrite,
                        {
                            Update: {
                                TableName: 'Suggestions',
                                Key: {
                                    userId: suggestionUserId,
                                    suggestionId,
                                },
                                UpdateExpression: 'ADD #likes :likesChange, #dislikes :dislikesChange',
                                ConditionExpression: countCondition,
                                ExpressionAttributeNames: {
                                    '#likes': 'likes',
                                    '#dislikes': 'dislikes',
                                    '#suggestionId': 'suggestionId',
                                },
                                ExpressionAttributeValues: countValues,
                            },
                        },
                    ],
                })
            );

            setViewerVote(nextVote);
            onCountsChange(likes + change.likes, dislikes + change.dislikes);

            // Read the authoritative totals in case other people voted at the same time.
            try {
                const currentSuggestion = await docClient.send(
                    new GetCommand({
                        TableName: 'Suggestions',
                        Key: { userId: suggestionUserId, suggestionId },
                        ConsistentRead: true,
                    })
                );
                if (currentSuggestion.Item) {
                    onCountsChange(
                        Number(currentSuggestion.Item.likes ?? 0),
                        Number(currentSuggestion.Item.dislikes ?? 0)
                    );
                }
            } catch (refreshError) {
                console.warn('Vote saved, but latest totals could not be refreshed:', refreshError);
            }
        } catch (err) {
            console.error('Could not save vote:', err);
            setError(describeDatabaseError(err, 'SuggestionVotes'));
        } finally {
            savingVote.current = false;
            setSaving(false);
        }
    }

    const disabled = loading || saving || !viewerId || ownSuggestion;

    return (
        <div className='suggestion_votes'
            aria-label='Suggestion voting'
            title={error || `${likes} likes, ${dislikes} dislikes`}
            data-suggestion-voting='true'>
            <button
                type='button'
                className='suggestion_vote_button suggestion_vote_up'
                aria-label={viewerVote === 'like' ? 'Remove like' : 'Like this suggestion'}
                aria-pressed={viewerVote === 'like'}
                onClick={() => void handleVote('like')}
                disabled={disabled}
                title='Like'
            >
                <svg viewBox='0 0 48 48' aria-hidden='true' focusable='false'>
                    <path d='M24 43 V7 M8 23 L24 7 L40 23' />
                </svg>
            </button>

            <span className='suggestion_vote_score' aria-label={`Score: ${likes - dislikes}`}>
                {likes - dislikes}
            </span>

            <button
                type='button'
                className='suggestion_vote_button suggestion_vote_down'
                aria-label={viewerVote === 'dislike' ? 'Remove dislike' : 'Dislike this suggestion'}
                aria-pressed={viewerVote === 'dislike'}
                onClick={() => void handleVote('dislike')}
                disabled={disabled}
                title='Dislike'
            >
                <svg viewBox='0 0 48 48' aria-hidden='true' focusable='false'>
                    <path d='M24 5 V41 M8 25 L24 41 L40 25' />
                </svg>
            </button>

            {error && (
                <span className='suggestion_vote_error_marker' role='alert'
                    title={error} aria-label={error}>i</span>
            )}
            {saving && <span className='suggestion_vote_saving' role='status'>Saving</span>}
        </div>
    );
}
