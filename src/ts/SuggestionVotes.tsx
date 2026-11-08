import { useEffect, useRef, useState } from 'react';
import '../css/SuggestionVotes.css';
import { describeDatabaseError, getSignedInDynamo } from './dynamoSession';
import { createSuggestionStore, type Vote } from './suggestionStore';

interface SuggestionVotesProps {
    suggestionId: string;
    suggestionUserId: string;
    likes: number;
    dislikes: number;
    onCountsChange: (likes: number, dislikes: number) => void;
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
    const [retryCount, setRetryCount] = useState(0);
    const savingVote = useRef(false);
    const ownSuggestion = viewerId !== '' && viewerId === suggestionUserId;

    useEffect(() => {
        let active = true;

        async function loadVote() {
            setLoading(true);
            setError('');
            setViewerId('');
            setViewerVote('none');

            try {
                const { userId, client } = await getSignedInDynamo();
                const store = createSuggestionStore(client);
                const vote = await store.readVote(
                    { userId: suggestionUserId, suggestionId },
                    userId,
                );
                if (active) {
                    setViewerId(userId);
                    setViewerVote(vote);
                }
            } catch (error) {
                console.error('Could not load your vote:', error);
                if (active) {
                    setError(describeDatabaseError(error, 'SuggestionVotes'));
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadVote();
        return () => {
            active = false;
        };
    }, [suggestionId, suggestionUserId, retryCount]);

    async function handleVote(clickedVote: 'like' | 'dislike') {
        if (savingVote.current || loading || !viewerId || ownSuggestion) {
            return;
        }

        savingVote.current = true;
        setSaving(true);
        setError('');
        const nextVote = viewerVote === clickedVote ? 'none' : clickedVote;

        try {
            const { userId, client } = await getSignedInDynamo();
            if (userId !== viewerId) {
                setRetryCount((count) => count + 1);
                return;
            }
            const store = createSuggestionStore(client);
            const result = await store.saveVote(
                { userId: suggestionUserId, suggestionId },
                userId,
                nextVote,
            );
            setViewerVote(result.vote);
            onCountsChange(result.likes, result.dislikes);
        } catch (error) {
            console.error('Could not save your vote:', error);
            setError(describeDatabaseError(error, 'SuggestionVotes'));
        } finally {
            savingVote.current = false;
            setSaving(false);
        }
    }

    const disabled = loading || saving || !viewerId || ownSuggestion;

    return (
        <div
            className='suggestion_votes'
            aria-label='Suggestion voting'
            title={error || `${likes} likes, ${dislikes} dislikes`}
            data-suggestion-voting='true'
        >
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

            <span
                className="suggestion_vote_score"
                aria-label={`Score: ${likes - dislikes}`}
            >
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

            {saving && (
                <span className='suggestion_vote_saving' role='status'>
                    Saving
                </span>
            )}
        </div>
    );
}
