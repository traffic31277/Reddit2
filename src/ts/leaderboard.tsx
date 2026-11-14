/*
* Code Reviewed By Brandon 11/1/2026.
* Keeps the original LIKES and NEWEST sorting options.
*/

import { useEffect, useState } from 'react';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ExecuteStatementCommand } from '@aws-sdk/lib-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import NavigationBar from './navbar.tsx';
import SuggestionComments from './SuggestionComments.tsx';
import SuggestionVotes from './SuggestionVotes.tsx';
import '../css/leaderboard_page.css';

interface Suggestion {
    userId: string;
    suggestionId: string;
    pseudonym: string;
    text: string;
    likes: number;
    dislikes: number;
    comments: number;
}

interface PostProps {
    suggestion: Suggestion;
    onCountsChange: (suggestion: Suggestion, likes: number, dislikes: number) => void;
}

function Post({ suggestion, onCountsChange }: PostProps) {
    return (
        <div className='post_background' id={suggestion.suggestionId}>
            <div className='post_main_row'>
                <div className='post_text_column'>
                    <h2 className='post_username'>{suggestion.pseudonym}</h2>
                    <p className='post_content'>{suggestion.text}</p>
                </div>

                <aside className='post_vote_column' aria-label='Like or dislike this suggestion'>
                    <SuggestionVotes
                        suggestionId={suggestion.suggestionId}
                        suggestionUserId={suggestion.userId}
                        likes={suggestion.likes}
                        dislikes={suggestion.dislikes}
                        onCountsChange={(likes, dislikes) => onCountsChange(suggestion, likes, dislikes)}
                    />
                </aside>
            </div>

            <div className='comments_section'>
                <SuggestionComments
                    suggestionId={suggestion.suggestionId}
                    suggestionUserId={suggestion.userId}
                    initialCommentCount={suggestion.comments}
                />
            </div>
        </div>
    );
}

// Function to get the start and end timestamps of the current week (Monday to Sunday)
function getWeekRange(now = new Date()) {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7); // Set to Monday
    start.setUTCHours(6, 0, 0, 0); // Set to 6 AM UTC

    // If the start of the week is in the future, adjust it to the previous week
    if (start.getTime() > now.getTime()) {
        start.setUTCDate(start.getUTCDate() - 7);
    }

    // The end of the week is 7 days after the start
    return {
        start: start.getTime(),
        end: start.getTime() + 7 * 24 * 60 * 60 * 1000
    };
}

export default function Leaderboard() {
    const [posts, setPosts] = useState<Suggestion[]>([]);
    const [sortBy, setSortBy] = useState<'none' | 'likes' | 'newest'>('none');
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function getPosts() {
            const client = new DynamoDBClient({
                region: 'us-east-2',
                credentials: fromCognitoIdentityPool({
                    identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
                }),
            });
            const docClient = DynamoDBDocumentClient.from(client);

            try {
                const allPosts: Suggestion[] = [];
                let nextToken: string | undefined;

                do {
                    const result = await docClient.send(new ExecuteStatementCommand({
                        Statement: 'SELECT * FROM Suggestions',
                        NextToken: nextToken,
                    }));

                    for (const item of result.Items ?? []) {
                        allPosts.push({
                            userId: String(item.userId),
                            suggestionId: String(item.suggestionId),
                            pseudonym: String(item.pseudonym ?? 'Anonymous'),
                            text: String(item.text ?? ''),
                            likes: Number(item.likes ?? 0),
                            dislikes: Number(item.dislikes ?? 0),
                            comments: Number(item.comments ?? 0),
                        });
                    }

                    nextToken = result.NextToken;
                } while (nextToken);

                if (active) {
                    setPosts(allPosts);
                }
            } catch (err) {
                console.error('Error retrieving suggestions:', err);
                if (active) {
                    setError('Could not load suggestions.');
                }
            }
        }

        void getPosts();
        return () => { active = false; };
    }, []);

    function updateVoteCounts(suggestion: Suggestion, likes: number, dislikes: number) {
        setPosts((currentPosts) => currentPosts.map((post) => {
            if (post.userId === suggestion.userId && post.suggestionId === suggestion.suggestionId) {
                return { ...post, likes, dislikes };
            }
            return post;
        }));
    }

    const { start, end } = getWeekRange();

    // Filter posts to only include those created within the current week
    const visiblePosts = posts.filter((post) => { 
        const created = Date.parse(post.suggestionId.slice('SUGGESTION_'.length)); 
        return created >= start && created < end; 
    });

return (
    <>
      <div>
        <h1 className='heading'>Weekly Leaderboard</h1>
      </div>
      
      <NavigationBar />

            <div>
                <button className='sort_button' onClick={() => setSortBy('likes')}>LIKES</button>
                <button className='sort_button' onClick={() => setSortBy('newest')}>NEWEST</button>
            </div>

            {error && <p role='alert'>{error}</p>}
            <div>
                {visiblePosts.map((suggestion) => (
                    <Post
                        key={`${suggestion.userId}/${suggestion.suggestionId}`}
                        suggestion={suggestion}
                        onCountsChange={updateVoteCounts}
                    />
                ))}
            </div>
      </>
    );
}
